import { z } from "zod";

export const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a valid time.");
export const availabilitySchema = z
  .array(
    z
      .object({
        day: z.number().int().min(0).max(6),
        start: time,
        end: time,
      })
      .refine(
        (v) => v.start < v.end,
        "End time must be after start time. Split overnight availability across days.",
      ),
  )
  .min(1, "Add at least one availability window.")
  .max(14, "Use at most 14 windows.")
  .refine(
    (windows) =>
      !windows.some((a, i) =>
        windows
          .slice(i + 1)
          .some((b) => a.day === b.day && a.start < b.end && b.start < a.end),
      ),
    "Availability windows on the same day must not overlap.",
  );

export const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters for your name.")
    .max(60),
  goal: z
    .string()
    .trim()
    .min(10, "Describe your goal in at least 10 characters.")
    .max(500),
  experience: z
    .string()
    .trim()
    .min(10, "Describe your experience in at least 10 characters.")
    .max(1000),
  skills: z.string().trim().min(2, "Add something you can help with.").max(500),
  timezone: z
    .string()
    .max(100)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value }).format();
        return value.length > 0;
      } catch {
        return false;
      }
    }, "Choose a valid IANA timezone, such as Europe/London."),
  availability: availabilitySchema,
});
export const circleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters for the circle name.")
    .max(60),
  description: z
    .string()
    .trim()
    .min(10, "Describe your circle in at least 10 characters.")
    .max(500),
});
export const invitationSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-f]{64}$/, "Paste the complete 64-character invitation code.");
export const uuidSchema = z.uuid();
export type Availability = z.infer<typeof availabilitySchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type Profile = ProfileInput & { user_id: string; updated_at: string };
export type Circle = {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
};
