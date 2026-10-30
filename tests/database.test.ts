import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

// Disposable PostgreSQL engine, never an application database/fallback. No hosted accounts are created.
const ids = Array.from(
  { length: 8 },
  (_, i) => `00000000-0000-4000-a000-${String(i + 1).padStart(12, "0")}`,
);
let db: PGlite;
async function asUser(index: number | null) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, true)", [
    index === null ? "" : ids[index],
  ]);
  await db.exec(`set local role ${index === null ? "anon" : "authenticated"}`);
}
async function denied(sql: string, params: unknown[] = []) {
  await db.exec("savepoint expected_denial");
  let error: unknown;
  try {
    await db.query(sql, params);
  } catch (caught) {
    error = caught;
  }
  await db.exec("rollback to savepoint expected_denial");
  expect(error).toBeDefined();
}
async function newCircle() {
  const result = await db.query<{ id: string }>(
    "select public.create_circle('Policy circle','A disposable policy test circle') as id",
  );
  return result.rows[0].id;
}
async function invitation(circle: string) {
  return (
    await db.query<{ code: string; expires_at: string }>(
      "select * from public.create_invitation($1)",
      [circle],
    )
  ).rows[0];
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  const directory = new URL("../supabase/migrations/", import.meta.url);
  for (const file of readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync(new URL(file, directory), "utf8"));
  }
}, 30000);
beforeEach(async () => {
  await db.exec("begin");
  for (const [index, id] of ids.entries()) {
    await db.query("insert into auth.users(id) values ($1)", [id]);
    if (index < 7)
      await db.query(
        "insert into public.profiles(user_id,display_name,goal,experience,skills,timezone,availability) values ($1,$2,'Learn database joins','Basic database experience','Test explanation','Europe/London',$3)",
        [
          id,
          `Policy fixture ${index}`,
          JSON.stringify([{ day: 0, start: "18:00", end: "19:00" }]),
        ],
      );
  }
  await asUser(0);
});
afterEach(async () => {
  await db.exec("rollback");
});
afterAll(async () => {
  await db?.close();
});

describe("database authorization and invitations", () => {
  it("keeps privileged implementations outside the public API schema", async () => {
    const exposed = await db.query(
      "select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef",
    );
    expect(exposed.rows).toHaveLength(0);
    const access = await db.query<{ allowed: boolean }>(
      "select has_schema_privilege('anon','circle_private','USAGE') as allowed",
    );
    expect(access.rows[0].allowed).toBe(false);
  });
  it("atomically creates a circle and its creator membership", async () => {
    const circle = await newCircle();
    expect(
      (
        await db.query("select * from public.memberships where circle_id=$1", [
          circle,
        ])
      ).rows,
    ).toHaveLength(1);
  });
  it("hides circles, memberships and unrelated profiles from nonmembers", async () => {
    const circle = await newCircle();
    await asUser(1);
    expect(
      (await db.query("select * from public.circles where id=$1", [circle]))
        .rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query("select * from public.memberships where circle_id=$1", [
          circle,
        ])
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query("select * from public.profiles where user_id=$1", [
          ids[0],
        ])
      ).rows,
    ).toHaveLength(0);
    await denied("select * from auth.users");
  });
  it("rejects direct membership insertion and circle writes", async () => {
    const circle = await newCircle();
    await asUser(1);
    await denied(
      "insert into public.memberships(circle_id,user_id) values ($1,$2)",
      [circle, ids[1]],
    );
    await denied("update public.circles set owner_id=$1 where id=$2", [
      ids[1],
      circle,
    ]);
    await denied("select * from public.invitations");
    await denied("select public.create_invitation($1)", [circle]);
  });
  it("redeems a valid invitation idempotently and reveals only shared profile fields", async () => {
    const circle = await newCircle();
    const invite = await invitation(circle);
    expect(invite.code).toMatch(/^[0-9a-f]{64}$/);
    await asUser(1);
    for (let i = 0; i < 2; i++)
      expect(
        (
          await db.query<{ id: string }>(
            "select public.redeem_invitation($1) as id",
            [invite.code],
          )
        ).rows[0].id,
      ).toBe(circle);
    expect(
      (
        await db.query("select * from public.memberships where circle_id=$1", [
          circle,
        ])
      ).rows,
    ).toHaveLength(2);
    const visible = (
      await db.query("select * from public.profiles where user_id=$1", [ids[0]])
    ).rows;
    expect(visible).toHaveLength(1);
    expect(visible[0]).not.toHaveProperty("email");
    expect(
      (
        await db.query("select * from public.profiles where user_id=$1", [
          ids[2],
        ])
      ).rows,
    ).toHaveLength(0);
  });
  it("allows own profile edits but blocks another member's edits and ID changes", async () => {
    const circle = await newCircle();
    const invite = await invitation(circle);
    await asUser(1);
    await db.query("select public.redeem_invitation($1)", [invite.code]);
    expect(
      (
        await db.query(
          "update public.profiles set display_name='Changed' where user_id=$1 returning *",
          [ids[0]],
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          "update public.profiles set display_name='Own change' where user_id=$1 returning *",
          [ids[1]],
        )
      ).rows,
    ).toHaveLength(1);
    await denied("update public.profiles set user_id=$1 where user_id=$2", [
      ids[2],
      ids[1],
    ]);
    await denied(
      "insert into public.profiles(user_id,display_name,goal,experience,skills,timezone,availability) values ($1,'Someone else','Goal description','Experience text','SQL','UTC','[{\"day\":0,\"start\":\"10:00\",\"end\":\"11:00\"}]')",
      [ids[7]],
    );
  });
  it("rejects invalid, expired and revoked invitations", async () => {
    const circle = await newCircle();
    const old = await invitation(circle);
    const current = await invitation(circle);
    await asUser(1);
    await denied("select public.redeem_invitation($1)", [old.code]);
    await denied("select public.redeem_invitation($1)", ["f".repeat(64)]);
    await denied("select public.redeem_invitation($1)", ["invalid"]);
    await db.exec("reset role");
    await db.query(
      "update public.invitations set expires_at=clock_timestamp() where token_hash=sha256(convert_to($1,'UTF8'))",
      [current.code],
    );
    await asUser(1);
    await denied("select public.redeem_invitation($1)", [current.code]);
  });
  it("lets only the creator revoke invitations", async () => {
    const circle = await newCircle();
    const invite = await invitation(circle);
    await asUser(1);
    await denied("select public.revoke_invitations($1)", [circle]);
    await asUser(0);
    await db.query("select public.revoke_invitations($1)", [circle]);
    await asUser(1);
    await denied("select public.redeem_invitation($1)", [invite.code]);
  });
  it("requires a completed profile and enforces the six-person limit", async () => {
    const circle = await newCircle();
    const invite = await invitation(circle);
    await asUser(7);
    await denied("select public.redeem_invitation($1)", [invite.code]);
    await denied("select public.create_circle('Circle','A valid description')");
    for (let i = 1; i <= 5; i++) {
      await asUser(i);
      await db.query("select public.redeem_invitation($1)", [invite.code]);
    }
    await asUser(6);
    await denied("select public.redeem_invitation($1)", [invite.code]);
    await asUser(0);
    expect(
      (
        await db.query("select * from public.memberships where circle_id=$1", [
          circle,
        ])
      ).rows,
    ).toHaveLength(6);
  });
  it("rejects invalid profile values through direct database calls", async () => {
    await denied(
      "update public.profiles set timezone='Not/AZone' where user_id=$1",
      [ids[0]],
    );
    await denied(
      "update public.profiles set availability='[]' where user_id=$1",
      [ids[0]],
    );
    await denied(
      'update public.profiles set availability=\'[{"day":0,"start":"19:00","end":"18:00"}]\' where user_id=$1',
      [ids[0]],
    );
    await denied("update public.profiles set goal='tiny' where user_id=$1", [
      ids[0],
    ]);
  });
  it("denies anonymous reads and all membership RPCs", async () => {
    const circle = await newCircle();
    await asUser(null);
    await denied("select * from public.circles");
    await denied("select * from public.profiles");
    await denied("select public.create_circle('Circle','A valid description')");
    await denied("select public.create_invitation($1)", [circle]);
    await denied("select public.redeem_invitation($1)", ["a".repeat(64)]);
  });
});
