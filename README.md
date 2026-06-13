# ATProto MCP Server

A Model Context Protocol (MCP) server for interacting with the AT Protocol (ATProto) ecosystem, including Bluesky.

## Features

- `get_profile`: Retrieve user profile information by handle or DID.
- `resolve_handle`: Resolve a handle to its corresponding DID.

## Installation

```bash
npm install
npm run build
```

## Configuration

To use this with an MCP client (like Claude Desktop), add the following to your configuration:

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

## Tech Stack

- [AT Protocol API](https://github.com/bluesky-social/atproto)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- TypeScript
