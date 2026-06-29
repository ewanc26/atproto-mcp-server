# ATProto MCP Server

An MCP server for the AT Protocol and Bluesky.

## Tools

- `get_profile` — Get an actor profile by handle or DID.
- `resolve_handle` — Resolve a handle to a DID.
- `search_posts` — Search public posts by keyword.
- `get_author_feed` — Get a user's feed.
- `get_post_thread` — Get a post and its replies.
- `get_suggestions` — Get follow recommendations.

Uses `https://public.api.bsky.app` for read-only requests. No auth needed.

## Install

```bash
npm install
npm run build
```

## Config (Claude Desktop)

```json
{
  "mcpServers": {
    "atproto": {
      "command": "node",
      "args": ["/path/to/atproto-mcp-server/dist/index.js"]
    }
  }
}
```
