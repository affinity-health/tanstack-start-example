import { Circle, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { useClinicCommerce } from "../marketplace/clinic-commerce";
import { registerDocumentWebMcpTools, type WebMcpRegistrationStatus } from "../../lib/webmcp";
import { createMarketplaceTools } from "./marketplace-tools";

export function ClinicAgentTools() {
  const commerce = useClinicCommerce();
  const navigate = useNavigate();
  const [status, setStatus] = useState<WebMcpRegistrationStatus>("registering");
  const tools = useMemo(
    () =>
      createMarketplaceTools({
        searchMarketplace(query, category, message) {
          commerce.setQuery(query);
          commerce.setCategory(category);
          commerce.closeProduct();
          commerce.setActivity(message);
          void navigate({ to: "/dashboard" });
        },
        openProduct(productId, message) {
          commerce.openProduct(productId);
          commerce.setActivity(message);
          void navigate({ to: "/dashboard" });
        },
        addToCart(productId, patientId, message) {
          commerce.addToCart(productId, patientId);
          commerce.setActivity(message);
          void navigate({ to: "/cart" });
        },
        inspectCart(patientId, message) {
          commerce.setSelectedCartPatientId(patientId);
          commerce.setActivity(message);
          void navigate({ to: "/cart" });
          return commerce.cart.filter((line) => line.patientId === patientId);
        },
      }),
    [commerce, navigate],
  );

  useEffect(() => registerDocumentWebMcpTools(tools, setStatus).dispose, [tools]);
  const Icon = status === "active" ? CheckCircle : status === "error" ? WarningCircle : Circle;
  return (
    <span className={`clinic-agent-state is-${status}`} title={commerce.activity}>
      <Icon aria-hidden size={14} />
      {status === "active"
        ? "4 agent tools"
        : status === "error"
          ? "Agent tools unavailable"
          : status === "registering"
            ? "Loading agent tools"
            : "WebMCP optional"}
    </span>
  );
}
