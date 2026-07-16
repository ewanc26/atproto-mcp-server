# AGENTS.md

Guidance for agents working on the AT Protocol MCP server.

## Project overview

This Node.js/TypeScript stdio server exposes public Bluesky reads and authenticated account actions as MCP tools. `src/` contains server registration, schemas, AT Protocol client behavior, and response shaping; `tests/` exercises the compiled server boundary.

## Invariants

- MCP stdout is protocol-only. Send diagnostics to stderr and never print banners or debug objects to stdout.
- Every advertised tool needs a stable name, JSON schema, handler, and useful MCP error. Keep `tools/list` and `tools/call` behavior aligned.
- Validate cursors, DIDs, handles, AT URIs, CIDs, record keys, and write inputs before network calls.
- Public reads must work without credentials. Authenticated tools must fail clearly without leaking handles, passwords, tokens, or authorization headers.
- Writes must target exact records and return identifiers callers can safely reuse. Do not report success before the PDS confirms it.
- Preserve pagination and avoid unbounded response payloads.

## Validation

```bash
npm install
npm test
```

`npm test` builds with `tsc` and runs the Node test suite. Also perform an in-memory MCP client round trip for registration/dispatch and, when network access is appropriate, one read-only public lookup. Test authenticated behavior with dedicated non-production credentials only. Keep `package-lock.json` authoritative and do not commit `build/`, credentials, or client configuration.
