import {
  normalizePublishProofAction,
  type PublishProofAction,
  type PublishProofInput,
} from "./action.js";
import type { ProofPublisher, PublishReceipt } from "./provider.js";

export interface PublishProofResult {
  action: PublishProofAction;
  receipt: PublishReceipt;
}

export class ProofPublishingService {
  constructor(private readonly publisher: ProofPublisher) {}

  async publish(input: PublishProofInput): Promise<PublishProofResult> {
    const action = normalizePublishProofAction(input);

    // This seam is intentionally small so an authority decision can interrupt
    // immediately before the provider runs and bind to the normalized action.
    const receipt = await this.publisher.send(action);

    return { action, receipt };
  }
}
