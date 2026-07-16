# AGENTS.md

Guidance for agents working on the TypeScript AT Protocol MCP server.

## Executed surface

- `src/index.ts` is the complete runtime entry point. It selects the service URL, logs in through `SessionManager`, declares 16 tools, maps their handlers to `BskyAgent`, and serves MCP over stdio.
- Public reads default to `https://public.api.bsky.app`. If `BSKY_HANDLE` is set the default becomes `https://bsky.social`; authentication only succeeds when both `BSKY_HANDLE` and `BSKY_PASSWORD` are present.
- Authenticated tools are `get_timeline`, `create_post`, `delete_post`, `follow`, `unfollow`, `like`, and `unlike`. Reply creation requires all four root/parent URI/CID fields or none.
- Most files under `src/core/` are manager prototypes and are not imported by the server, except `session.ts`. Changing one of those modules does not expose a new MCP tool; registration, schema, and handler work belongs in `index.ts`.
- `tests/mcp.test.mjs` is the only suite run by `npm test`. The two checked-in `.ts` test scripts are excluded by `tsconfig.json`'s `rootDir` and are not selected by the test command.

## Protocol and AT Protocol invariants

- Stdout is MCP transport only. Runtime diagnostics belong on stderr; test-only output is fine outside the server process.
- Keep `tools` and `handlers` one-to-one with unique stable names. Every new tool needs an `additionalProperties: false` JSON schema, explicit handler validation for direct-call tests, bounded results, and a useful MCP failure.
- Public tools must remain usable without credentials. `requireAuth()` consults the module-global `SessionManager`, not the injected agent passed to `createServer`; account for this when refactoring or testing writes.
- The session's 30-minute “refresh loop” currently only logs and does not refresh a token. Do not claim proactive refresh or resilient reauthentication until it actually calls the API and has shutdown cleanup.
- Write helpers accept strings after only non-empty checks. Preserve exact AT URIs/CIDs/rkeys and add structural validation before broadening destructive operations. Do not return `{ deleted: true }` until the underlying deletion resolves.
- `create_post` uses `RichText.detectFacets`, which performs identity lookups for mentions, and does not impose a post-size limit in the handler. Test Unicode byte ranges and network failure.
- Returned non-MCP errors are serialized from `error.message`. Never expose credentials, tokens, authorization headers, or overly detailed upstream responses.
- Prototype caveats matter when activating them: `FederationManager.inspectPdsStatus` ignores its `pdsUrl`; custom facet managers use JavaScript string offsets where AT Protocol requires UTF-8 byte offsets; Jetstream URL builders do not URL-encode filters; several social methods force-unwrap the session DID.

## Development and validation

Requires Node.js 20 or newer. Keep `package-lock.json` authoritative and use `npm install` (or `npm ci` for a clean reproducible install), then run `npm test`. That command compiles `src/` and runs `tests/*.test.mjs`; if the TypeScript structural scripts are meant to be tests, wire them into the build/test configuration rather than assuming they execute. Also perform an in-memory MCP initialize/list/call round trip. A live check should be read-only by default; authenticated writes require explicit dedicated test-account credentials. Do not commit `build/`, `.env`, MCP client secrets, or captured protocol traffic.
