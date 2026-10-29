"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowRight, Check, Copy, Plus, Trash2 } from "lucide-react";
import {
  createCircle,
  joinCircle,
  manageInvitations,
  saveProfile,
  type ActionState,
} from "@/app/actions";
import { days, type Availability, type Profile } from "@/lib/validation";
import { Notice } from "./ui-notice";

const initial: ActionState = {};

export function ProfileForm({
  profile,
  next,
}: {
  profile: Profile | null;
  next: string;
}) {
  const [state, action, pending] = useActionState(saveProfile, initial);
  const [windows, setWindows] = useState<Availability>(
    profile?.availability || [],
  );
  const [timezone, setTimezone] = useState(profile?.timezone || "");
  useEffect(() => {
    if (!profile?.timezone)
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [profile]);
  function update(index: number, field: string, value: string | number) {
    setWindows((current) =>
      current.map((window, i) =>
        i === index ? { ...window, [field]: value } : window,
      ),
    );
  }
  return (
    <form action={action} className="profile-form">
      <input type="hidden" name="next" value={next} />
      <section className="card form-section">
        <div className="section-label">
          <span>01</span>
          <div>
            <h2>A little about you</h2>
            <p>
              Give your circle a sense of where you are and where you’re headed.
            </p>
          </div>
        </div>
        <label>
          Display name
          <input
            name="display_name"
            autoComplete="nickname"
            required
            minLength={2}
            maxLength={60}
            defaultValue={profile?.display_name}
            placeholder="What should your circle call you?"
          />
        </label>
        <label>
          Your current goal
          <textarea
            name="goal"
            required
            minLength={10}
            maxLength={500}
            defaultValue={profile?.goal}
            placeholder="What would you like to learn or move towards?"
            rows={3}
          />
          <span className="field-help">
            One career or learning goal you’d like support with.
          </span>
        </label>
        <label>
          Your experience
          <textarea
            name="experience"
            required
            minLength={10}
            maxLength={1000}
            defaultValue={profile?.experience}
            placeholder="Where are you starting from?"
            rows={3}
          />
        </label>
        <label>
          Skills you can offer
          <textarea
            name="skills"
            required
            minLength={2}
            maxLength={500}
            defaultValue={profile?.skills}
            placeholder="What could you help someone else with?"
            rows={2}
          />
          <span className="field-help">
            Everyone has something to share, including a fresh perspective.
          </span>
        </label>
      </section>
      <section className="card form-section">
        <div className="section-label">
          <span>02</span>
          <div>
            <h2>Make time to connect</h2>
            <p>
              Share your typical weekly availability. You can change it anytime.
            </p>
          </div>
        </div>
        <label>
          Timezone
          <input
            name="timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            required
            maxLength={100}
            placeholder="Europe/London"
            list="timezones"
          />
          <datalist id="timezones">
            {[
              "Europe/London",
              "Africa/Lagos",
              "America/New_York",
              "America/Los_Angeles",
              "Asia/Kolkata",
              "Europe/Paris",
              "Asia/Tokyo",
              "Australia/Sydney",
              "UTC",
            ].map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
          <span className="field-help">
            All times below are in this timezone. Use an IANA timezone name.
          </span>
        </label>
        <input
          type="hidden"
          name="availability"
          value={JSON.stringify(windows)}
        />
        <fieldset>
          <legend>Weekly availability</legend>
          {windows.length === 0 && (
            <div className="empty-inline">
              No availability added. Add a time when you’re usually free.
            </div>
          )}
          <div className="availability-list">
            {windows.map((window, index) => (
              <div className="availability-row" key={index}>
                <label>
                  <span className="sr-only">Day for window {index + 1}</span>
                  <select
                    value={window.day}
                    onChange={(event) =>
                      update(index, "day", Number(event.target.value))
                    }
                  >
                    {days.map((day, dayIndex) => (
                      <option key={day} value={dayIndex}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="sr-only">
                    Start time for window {index + 1}
                  </span>
                  <input
                    type="time"
                    required
                    value={window.start}
                    onChange={(event) =>
                      update(index, "start", event.target.value)
                    }
                  />
                </label>
                <span className="time-separator">to</span>
                <label>
                  <span className="sr-only">
                    End time for window {index + 1}
                  </span>
                  <input
                    type="time"
                    required
                    value={window.end}
                    onChange={(event) =>
                      update(index, "end", event.target.value)
                    }
                  />
                </label>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove availability window ${index + 1}`}
                  onClick={() =>
                    setWindows((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button button-secondary button-small"
            disabled={windows.length >= 14}
            onClick={() =>
              setWindows((current) => [
                ...current,
                { day: 0, start: "18:00", end: "19:00" },
              ])
            }
          >
            <Plus size={16} /> Add a time window
          </button>
          <p className="field-help mt-3">
            Up to 14 windows. Split overnight times across two days.
          </p>
        </fieldset>
      </section>
      <div className="sharing-note">
        <Check size={18} />
        <p>
          These profile details are shared only with people in your circles.
          Your account email stays private.
        </p>
      </div>
      <Notice {...state} />
      <button className="button" disabled={pending}>
        {pending
          ? "Saving your profile…"
          : profile
            ? "Save changes"
            : "Save profile & continue"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}

export function CreateCircleForm() {
  const [state, action, pending] = useActionState(createCircle, initial);
  return (
    <form action={action} className="stack-form">
      <label>
        Circle name
        <input
          name="name"
          required
          minLength={3}
          maxLength={60}
          placeholder="A name for your shared chapter"
        />
      </label>
      <label>
        What brings you together?
        <textarea
          name="description"
          rows={3}
          required
          minLength={10}
          maxLength={500}
          placeholder="Describe the interests or ambitions you want to connect around."
        />
      </label>
      <Notice {...state} />
      <button className="button" disabled={pending}>
        {pending ? "Creating…" : "Create circle"}
        <Plus size={17} />
      </button>
    </form>
  );
}

export function JoinCircleForm({ code = "" }: { code?: string }) {
  const [state, action, pending] = useActionState(joinCircle, initial);
  return (
    <form action={action} className="stack-form">
      <label>
        Invitation code
        <input
          name="code"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
          minLength={64}
          maxLength={64}
          defaultValue={code}
          placeholder="Paste your 64-character code"
          className="code-input"
        />
      </label>
      <p className="field-help">
        Joining shares your profile with this circle’s members. Links expire
        after seven days and can be revoked by the creator.
      </p>
      <Notice {...state} />
      <button className="button button-secondary" disabled={pending}>
        {pending ? "Joining…" : "Join circle"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}

function CopyField({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState("");
  return (
    <div className="copy-field">
      <label>
        {label}
        <input
          readOnly
          value={value}
          onFocus={(event) => event.target.select()}
        />
      </label>
      <button
        type="button"
        className="icon-button"
        aria-label={`Copy ${label.toLowerCase()}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setStatus("Copied");
          } catch {
            setStatus("Select the text and copy it manually.");
          }
        }}
      >
        {status === "Copied" ? <Check size={18} /> : <Copy size={18} />}
      </button>
      {status && (
        <span role="status" className="field-help">
          {status}
        </span>
      )}
    </div>
  );
}

export function InvitationForm({ circleId }: { circleId: string }) {
  const [state, action, pending] = useActionState(manageInvitations, initial);
  return (
    <div className="invitation-panel">
      <form action={action}>
        <input type="hidden" name="circle_id" value={circleId} />
        <button
          name="intent"
          value="create"
          className="button button-small"
          disabled={pending}
        >
          {pending ? "Updating invitations…" : "Create a fresh invitation"}
          <Plus size={16} />
        </button>
        <button
          name="intent"
          value="revoke"
          className="text-link"
          disabled={pending}
        >
          Revoke existing invitations
        </button>
      </form>
      <Notice {...state} />
      <p className="field-help">
        Valid for seven days, for up to six total members. Creating a new
        invitation revokes the previous one. Anyone with it can join; share it
        thoughtfully.
      </p>
      {state.code && state.link && (
        <div className="invitation-result">
          <CopyField value={state.link} label="Invitation link" />
          <CopyField value={state.code} label="Invitation code" />
          <p className="field-help">
            Expires{" "}
            {new Date(state.expiresAt!).toLocaleString(undefined, {
              timeZone: "UTC",
            })}{" "}
            UTC. Copy it now; only its hash is stored.
          </p>
        </div>
      )}
    </div>
  );
}
