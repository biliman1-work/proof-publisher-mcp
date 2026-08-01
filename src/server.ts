import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpWebhookProofPublisher } from "./provider.js";
import { ProofPublishingService } from "./service.js";

const writeEnabled = process.env.ENABLE_WEBHOOK_WRITES === "true";
const allowedOrigin = process.env.WEBHOOK_ALLOWED_ORIGIN ?? "https://example.invalid";

const service = new ProofPublishingService(
  new HttpWebhookProofPublisher({ enabled: writeEnabled, allowedOrigin }),
);

const server = new McpServer({ name: "proof-publisher-mcp", version: "0.1.0" });

server.registerTool(
  "publish_proof",
  {
    description:
      "Publish a commit-bound proof summary to an explicitly allowed HTTPS webhook.",
    inputSchema: {
      targetUrl: z.string().url(),
      repository: z.string().min(3),
      revision: z.string().length(40),
      summary: z.string().min(1).max(500),
    },
  },
  async (input) => {
    try {
      const result = await service.publish(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      return {
        isError: true,
        content: [{ type: "text", text: message }],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
