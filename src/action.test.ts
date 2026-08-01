import { describe, expect, it } from "vitest";
import { normalizePublishProofAction } from "./action.js";

const validInput = {
  targetUrl: "https://hooks.example.com/proofs",
  repository: "biliman1-work/proof-publisher-mcp",
  revision: "0123456789abcdef0123456789abcdef01234567",
  summary: "CI passed for the exact commit.",
};

describe("normalizePublishProofAction", () => {
  it("normalizes and fingerprints an exact action", () => {
    const action = normalizePublishProofAction(validInput);

    expect(action.actionClass).toBe("proof.webhook.publish");
    expect(action.targetUrl).toBe("https://hooks.example.com/proofs");
    expect(action.fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same normalized action", () => {
    expect(normalizePublishProofAction(validInput).fingerprint).toBe(
      normalizePublishProofAction({ ...validInput }).fingerprint,
    );
  });

  it.each([
    [{ ...validInput, targetUrl: "http://hooks.example.com/proofs" }, "HTTPS"],
    [{ ...validInput, repository: "not-a-repository" }, "owner/name"],
    [{ ...validInput, revision: "deadbeef" }, "40-character"],
    [{ ...validInput, summary: "   " }, "between 1 and 500"],
  ])("rejects malformed input", (input, expected) => {
    expect(() => normalizePublishProofAction(input)).toThrow(expected);
  });
});
