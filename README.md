# Proof Publisher MCP

A deliberately small TypeScript MCP server that publishes commit-bound proof
summaries to an HTTPS webhook. The project exists to make one consequential
external write easy to inspect, test, and place behind an authority boundary.

## Consequential boundary

The `publish_proof` MCP tool calls `ProofPublishingService.publish()`. The
service validates and normalizes the exact target, repository, full commit SHA,
and summary, then calls `ProofPublisher.send(action)`. The live implementation's
only external write is the `fetch()` POST inside
`HttpWebhookProofPublisher.send()`.

```text
MCP publish_proof
  -> normalize exact action + SHA-256 fingerprint
  -> ProofPublisher.send(action)       <-- authority seam
  -> fetch(allowed HTTPS origin)        <-- consequential provider call
```

Writes fail closed unless `ENABLE_WEBHOOK_WRITES=true`, and even then the
target must match `WEBHOOK_ALLOWED_ORIGIN`. Tests inject a recording provider;
they do not make network calls.

## Run the checks

```bash
npm install
npm run ci
```

## Run the MCP server

Read-only/fail-closed mode is the default:

```bash
npm run build
npm start
```

To permit a real webhook write, an operator must explicitly configure both the
write switch and the only allowed origin:

```bash
ENABLE_WEBHOOK_WRITES=true \
WEBHOOK_ALLOWED_ORIGIN=https://hooks.example.com \
npm start
```

No credentials are stored in this repository. The project is intentionally
small so future approval logic can bind to the normalized action immediately
before the provider runs, without moving validation or external I/O into the
authority layer.

