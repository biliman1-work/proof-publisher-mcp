import { createHash } from "node:crypto";

export interface PublishProofInput {
  targetUrl: string;
  repository: string;
  revision: string;
  summary: string;
}

export interface PublishProofAction {
  actionClass: "proof.webhook.publish";
  targetUrl: string;
  repository: string;
  revision: string;
  summary: string;
  fingerprint: string;
}

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const fullCommitPattern = /^[0-9a-fA-F]{40}$/;

export function normalizePublishProofAction(input: PublishProofInput): PublishProofAction {
  const target = new URL(input.targetUrl);

  if (target.protocol !== "https:") {
    throw new Error("targetUrl must use HTTPS");
  }

  if (target.username || target.password || target.hash) {
    throw new Error("targetUrl must not contain credentials or a fragment");
  }

  const repository = input.repository.trim();
  if (!repositoryPattern.test(repository)) {
    throw new Error("repository must use the owner/name form");
  }

  const revision = input.revision.trim().toLowerCase();
  if (!fullCommitPattern.test(revision)) {
    throw new Error("revision must be a full 40-character hexadecimal commit SHA");
  }

  const summary = input.summary.trim();
  if (summary.length === 0 || summary.length > 500) {
    throw new Error("summary must contain between 1 and 500 characters");
  }

  const normalized = {
    actionClass: "proof.webhook.publish" as const,
    targetUrl: target.toString(),
    repository,
    revision,
    summary,
  };

  const fingerprint = createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");

  return { ...normalized, fingerprint };
}
