CREATE TABLE "affinity_webhook_event" (
  "id" text NOT NULL PRIMARY KEY,
  "type" text NOT NULL,
  "apiVersion" text NOT NULL,
  "livemode" integer NOT NULL,
  "payload" text NOT NULL,
  "receivedAt" date NOT NULL
);

CREATE INDEX "affinity_webhook_event_receivedAt_idx"
  ON "affinity_webhook_event" ("receivedAt");
