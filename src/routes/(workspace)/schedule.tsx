import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Clock3, MapPin, Video } from "lucide-react";
import { useState } from "react";

import { EmrSectionHeading, EmrShell, EmrStatus } from "../../components/emr-shell";
import { demoPatients, demoSchedule } from "../../lib/demo-data";
import { requireSession } from "../../lib/require-session";

export const Route = createFileRoute("/(workspace)/schedule")({
  beforeLoad: requireSession,
  head: () => ({
    meta: [{ title: "Schedule | Northstar Health" }],
  }),
  component: Schedule,
});

const days = Object.keys(demoSchedule);

function Schedule() {
  const { session } = Route.useRouteContext();
  const [activeDay, setActiveDay] = useState(days[0]);
  const appointments = demoSchedule[activeDay] ?? [];

  return (
    <EmrShell
      actions={
        <div className="emr-segmented" aria-label="Schedule date">
          {days.map((day) => (
            <button
              aria-pressed={activeDay === day}
              className={activeDay === day ? "is-active" : undefined}
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
      }
      current="schedule"
      description="A focused daily schedule for Northstar Telehealth."
      session={session}
      title="Schedule"
    >
      <section className="emr-schedule-summary">
        <div>
          <CalendarDays aria-hidden size={18} />
          <span>
            <small>Selected day</small>
            <strong>{activeDay}, 2026</strong>
          </span>
        </div>
        <div>
          <Clock3 aria-hidden size={18} />
          <span>
            <small>Clinical time</small>
            <strong>{appointments.length * 0.5 + 1.5} hours booked</strong>
          </span>
        </div>
        <div>
          <CheckCircle2 aria-hidden size={18} />
          <span>
            <small>Readiness</small>
            <strong>
              {appointments.filter((item) => item.status !== "Needs intake").length} ready
            </strong>
          </span>
        </div>
      </section>

      <section className="emr-panel emr-schedule-panel">
        <EmrSectionHeading
          description={`${appointments.length} appointments · Eastern Time`}
          title={`${activeDay} agenda`}
        />
        {appointments.length ? (
          <div className="emr-timeline">
            {appointments.map((appointment) => (
              <article key={appointment.id}>
                <div className="emr-timeline-time">
                  <strong>{appointment.time}</strong>
                  <span>{appointment.duration}</span>
                </div>
                <div className="emr-timeline-marker" aria-hidden />
                <div className="emr-appointment">
                  <div>
                    <strong>{appointment.patient}</strong>
                    <span>{appointment.type}</span>
                  </div>
                  <span className="emr-agenda-mode">
                    {appointment.mode === "Telehealth" ? (
                      <Video aria-hidden size={14} />
                    ) : (
                      <MapPin aria-hidden size={14} />
                    )}
                    {appointment.mode}
                  </span>
                  <EmrStatus tone={appointment.status === "Needs intake" ? "attention" : "success"}>
                    {appointment.status}
                  </EmrStatus>
                  <Link
                    className="emr-button emr-button-secondary"
                    to="/patients"
                    search={{
                      patientId: demoPatients.find(
                        (patient) => patient.name === appointment.patient,
                      )?.id,
                    }}
                  >
                    Open chart
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="emr-empty">
            <CalendarDays aria-hidden size={22} />
            <strong>No appointments</strong>
            <span>This day is open for scheduling.</span>
          </div>
        )}
      </section>
    </EmrShell>
  );
}
