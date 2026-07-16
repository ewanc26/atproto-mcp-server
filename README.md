# MCP Server for AT Protocol

An MCP server that gives compatible clients access to Bluesky and the AT Protocol over stdio. It works without credentials for public reads and enables account actions when Bluesky credentials are configured.

> Independent project; see the [trademark notice](TRADEMARKS.md).

## Available tools

Public tools: `get_profile`, `resolve_handle`, `search_posts`, `get_author_feed`, `get_post_thread`, `get_suggestions`, `get_actor_likes`, `get_followers`, and `get_follows`.

Authenticated tools: `get_timeline`, `create_post`, `delete_post`, `follow`, `unfollow`, `like`, and `unlike`.

Cursor-based tools accept the `cursor` returned by a previous response. Write operations use AT URIs (and, for likes, the target CID) so callers can safely refer to exact records.

## Install and run

Requires Node.js 20 or newer.

```bash
npm install
npm run build
npm start
```

The default read-only endpoint is `https://public.api.bsky.app`. To use another service, set `BSKY_SERVICE`.

For authenticated tools, set `BSKY_HANDLE` and `BSKY_PASSWORD`. A Bluesky app password is recommended instead of the account password. When credentials are present, the default service changes to `https://bsky.social`.

## MCP client configuration

Build the project first, then add it to your client's MCP configuration:

```json
{
  "mcpServers": {
    "atproto": {
      "command": "node",
      "args": ["/absolute/path/to/atproto-mcp-server/build/index.js"],
      "env": {
        "BSKY_HANDLE": "alice.bsky.social",
        "BSKY_PASSWORD": "xxxx-xxxx-xxxx-xxxx"
      }
    }
  }
}
```

Omit `env` for read-only use. The server writes logs to stderr, leaving stdout reserved for MCP messages.

## Development

```bash
npm test
```

The tests build the TypeScript project and validate that the advertised MCP tool surface is backed by handlers, including argument validation and AT Protocol request mapping.
