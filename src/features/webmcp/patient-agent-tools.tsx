import { Bot, CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { PatientFilter } from "../../lib/patient-workflow";
import { registerDocumentWebMcpTools, type WebMcpRegistrationStatus } from "../../lib/webmcp";
import { createPatientTools } from "./patient-tools";

type PatientAgentToolsProps = {
  onAnnouncement(message: string): void;
  onOpen(patientId: string, message: string): void;
  onPrepare(path: string, message: string): void;
  onSearch(query: string, status: PatientFilter, message: string): void;
};

const statusCopy: Record<WebMcpRegistrationStatus, string> = {
  active: "3 browser tools ready",
  error: "Tool registration failed",
  registering: "Registering browser tools",
  unsupported: "Human controls ready",
};

export function PatientAgentTools({
  onAnnouncement,
  onOpen,
  onPrepare,
  onSearch,
}: PatientAgentToolsProps) {
  const [status, setStatus] = useState<WebMcpRegistrationStatus>("registering");
  const tools = useMemo(
    () =>
      createPatientTools({
        openPatient: onOpen,
        prepareReview: onPrepare,
        searchPatients: onSearch,
      }),
    [onOpen, onPrepare, onSearch],
  );

  useEffect(() => {
    const registration = registerDocumentWebMcpTools(tools, (nextStatus) => {
      setStatus(nextStatus);
      if (nextStatus === "active") onAnnouncement("WebMCP tools are ready for a browser agent.");
    });
    return registration.dispose;
  }, [onAnnouncement, tools]);

  const StatusIcon =
    status === "active" ? CircleCheck : status === "error" ? CircleAlert : CircleDashed;

  return (
    <aside className={`agent-tools-status is-${status}`} aria-label="Browser agent tools">
      <span className="agent-tools-mark">
        <Bot aria-hidden size={17} />
      </span>
      <span>
        <strong>Agent-ready patient workflow</strong>
        <small>
          Search, inspect, and prepare a review. Clinical decisions stay with the clinician.
        </small>
      </span>
      <span className="agent-tools-state" role="status">
        <StatusIcon aria-hidden size={15} />
        {statusCopy[status]}
      </span>
    </aside>
  );
}
