import { describe, expect, it, vi } from "vitest";
import type { ProofPublisher } from "./provider.js";
import { ProofPublishingService } from "./service.js";

describe("ProofPublishingService", () => {
  it("passes one normalized action to the provider", async () => {
    const send = vi.fn<ProofPublisher["send"]>().mockImplementation(async (action) => ({
      status: 202,
      providerRequestId: "request-1",
      actionFingerprint: action.fingerprint,
    }));
    const service = new ProofPublishingService({ send });

    const result = await service.publish({
      targetUrl: "https://hooks.example.com/proofs",
      repository: "biliman1-work/proof-publisher-mcp",
      revision: "0123456789abcdef0123456789abcdef01234567",
      summary: "  Verified proof  ",
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(result.action);
    expect(result.action.summary).toBe("Verified proof");
    expect(result.receipt.actionFingerprint).toBe(result.action.fingerprint);
  });

  it("does not call the provider when normalization fails", async () => {
    const send = vi.fn<ProofPublisher["send"]>();
    const service = new ProofPublishingService({ send });

    await expect(
      service.publish({
        targetUrl: "http://hooks.example.com/proofs",
        repository: "biliman1-work/proof-publisher-mcp",
        revision: "0123456789abcdef0123456789abcdef01234567",
        summary: "proof",
      }),
    ).rejects.toThrow("HTTPS");

    expect(send).not.toHaveBeenCalled();
  });
});
