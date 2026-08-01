import type { PublishProofAction } from "./action.js";

export interface PublishReceipt {
  status: number;
  providerRequestId: string | null;
  actionFingerprint: string;
}

export interface ProofPublisher {
  send(action: PublishProofAction): Promise<PublishReceipt>;
}

export interface HttpWebhookProofPublisherOptions {
  enabled: boolean;
  allowedOrigin: string;
  fetchImpl?: typeof fetch;
}

export class HttpWebhookProofPublisher implements ProofPublisher {
  readonly #enabled: boolean;
  readonly #allowedOrigin: string;
  readonly #fetchImpl: typeof fetch;

  constructor(options: HttpWebhookProofPublisherOptions) {
    this.#enabled = options.enabled;
    this.#allowedOrigin = new URL(options.allowedOrigin).origin;
    this.#fetchImpl = options.fetchImpl ?? fetch;
  }

  async send(action: PublishProofAction): Promise<PublishReceipt> {
    if (!this.#enabled) {
      throw new Error("webhook writes are disabled");
    }

    if (new URL(action.targetUrl).origin !== this.#allowedOrigin) {
      throw new Error("target origin is not allowed");
    }

    // Consequential provider boundary: this is the only live external write.
    const response = await this.#fetchImpl(action.targetUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: action.repository,
        revision: action.revision,
        summary: action.summary,
        actionFingerprint: action.fingerprint,
      }),
    });

    if (!response.ok) {
      throw new Error(`webhook rejected the request with status ${response.status}`);
    }

    return {
      status: response.status,
      providerRequestId: response.headers.get("x-request-id"),
      actionFingerprint: action.fingerprint,
    };
  }
}
