import { describe, expect, it, vi } from "vitest";
import { normalizePublishProofAction } from "./action.js";
import { HttpWebhookProofPublisher } from "./provider.js";

const action = normalizePublishProofAction({
  targetUrl: "https://hooks.example.com/proofs",
  repository: "biliman1-work/proof-publisher-mcp",
  revision: "0123456789abcdef0123456789abcdef01234567",
  summary: "Verified proof",
});

describe("HttpWebhookProofPublisher", () => {
  it("fails closed without making a request when writes are disabled", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const publisher = new HttpWebhookProofPublisher({
      enabled: false,
      allowedOrigin: "https://hooks.example.com",
      fetchImpl,
    });

    await expect(publisher.send(action)).rejects.toThrow("disabled");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a changed origin without making a request", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const publisher = new HttpWebhookProofPublisher({
      enabled: true,
      allowedOrigin: "https://approved.example.com",
      fetchImpl,
    });

    await expect(publisher.send(action)).rejects.toThrow("not allowed");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("performs one POST for an explicitly enabled allowed target", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 202,
        headers: { "x-request-id": "request-2" },
      }),
    );
    const publisher = new HttpWebhookProofPublisher({
      enabled: true,
      allowedOrigin: "https://hooks.example.com",
      fetchImpl,
    });

    const receipt = await publisher.send(action);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://hooks.example.com/proofs",
      expect.objectContaining({ method: "POST" }),
    );
    expect(receipt).toEqual({
      status: 202,
      providerRequestId: "request-2",
      actionFingerprint: action.fingerprint,
    });
  });
});
