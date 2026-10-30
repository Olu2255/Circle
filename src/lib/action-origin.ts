import "server-only";
import { headers } from "next/headers";
import { requireConfig } from "./config";

export async function checkOrigin() {
  const origin = (await headers()).get("origin");
  if (origin !== requireConfig().origin)
    throw new Error("Open Circle at its configured address and try again.");
}
