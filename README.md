# ATProto MCP Server

A refined Model Context Protocol (MCP) server for interacting with the AT Protocol (ATProto) ecosystem, including Bluesky, built with official best practices.

## Features & Tools

- **Identity & Profiles**:
  - `get_profile`: Retrieve detailed actor profiles by handle or DID.
  - `resolve_handle`: Resolve handles to persistent DIDs.
- **Social Discovery**:
  - `search_posts`: Search for public posts using keywords.
  - `get_author_feed`: Fetch the feed of a specific user.
  - `get_post_thread`: Retrieve a post and its conversation tree.
  - `get_suggestions`: Get follow recommendations.

## Best Practices Implemented

Following standards from [atproto.com](https://atproto.com) and [endpoints.bsky.app](https://endpoints.bsky.app):
- **High-Performance Infrastructure**: Uses `https://public.api.bsky.app` for cached, read-only requests.
- **Robust Schema Design**: Detailed input schemas for better LLM tool discovery.
- **Error Handling**: Uses `McpError` for standardized error reporting.
- **Scalability**: Support for limit parameters and cursors for pagination.

## Installation

```bash
npm install
npm run build
```

## Configuration (Claude Desktop)

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
