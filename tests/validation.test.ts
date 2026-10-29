import { describe, expect, it } from "vitest";
import {
  availabilitySchema,
  circleSchema,
  invitationSchema,
  profileSchema,
} from "@/lib/validation";

const profile = {
  display_name: "  Test participant  ",
  goal: "Learn database joins",
  experience: "Starting with basic SQL",
  skills: "Explaining concepts",
  timezone: "Europe/London",
  availability: [{ day: 0, start: "18:00", end: "19:00" }],
};

describe("profile and circle validation", () => {
  it("trims valid profile inputs", () => {
    expect(profileSchema.parse(profile).display_name).toBe("Test participant");
  });
  it("rejects incomplete profiles and unknown timezones", () => {
    expect(profileSchema.safeParse({ ...profile, goal: "" }).success).toBe(
      false,
    );
    expect(
      profileSchema.safeParse({ ...profile, timezone: "Mars/Unknown" }).success,
    ).toBe(false);
  });
  it("requires a meaningful circle name and description", () => {
    expect(
      circleSchema.safeParse({ name: "  ", description: "Test" }).success,
    ).toBe(false);
    expect(
      circleSchema.parse({
        name: " Learning ",
        description: "A shared learning space",
      }).name,
    ).toBe("Learning");
  });
});

describe("availability", () => {
  it.each(
    [
      [],
      [{ day: 7, start: "18:00", end: "19:00" }],
      [{ day: 0, start: "25:00", end: "26:00" }],
      [{ day: 0, start: "19:00", end: "18:00" }],
      [{ day: 0, start: "18:00", end: "18:00" }],
      [
        { day: 0, start: "18:00", end: "19:00" },
        { day: 0, start: "18:30", end: "20:00" },
      ],
    ].map((windows) => ({ windows })),
  )("rejects invalid or overlapping windows: $windows", ({ windows }) => {
    expect(availabilitySchema.safeParse(windows).success).toBe(false);
  });
  it("accepts adjacent windows and overlapping hours on different days", () => {
    expect(
      availabilitySchema.safeParse([
        { day: 0, start: "18:00", end: "19:00" },
        { day: 0, start: "19:00", end: "20:00" },
        { day: 1, start: "18:00", end: "19:00" },
      ]).success,
    ).toBe(true);
  });
});

describe("invitation validation", () => {
  it("requires the full random code", () => {
    expect(invitationSchema.safeParse("a".repeat(64)).success).toBe(true);
    for (const value of [
      "",
      "a".repeat(63),
      "g".repeat(64),
      "https://example.com/join/abc",
    ])
      expect(invitationSchema.safeParse(value).success).toBe(false);
  });
});
