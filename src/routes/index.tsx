import { createFileRoute } from "@tanstack/react-router";
import { PrescribingApp } from "../features/prescribing/prescribing-app";

export const Route = createFileRoute("/")({ component: PrescribingApp });
