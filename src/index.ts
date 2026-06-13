import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { SessionManager } from "./core/session.js";
import { RichText } from "@atproto/api";
import * as fs from 'fs';

const BSKY_SERVICE = process.env.BSKY_SERVICE || (process.env.BSKY_HANDLE ? "https://bsky.social" : "https://public.api.bsky.app");
const sessionManager = new SessionManager(BSKY_SERVICE);

const server = new Server(
  {
    name: "atproto-mcp-server",
    version: "2.0.0",
  },
  {
    capabilities: { tools: {} },
  }
);

async function main() {
  await sessionManager.login();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ATProto MCP Server v2.0.0 (Modularized) running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});