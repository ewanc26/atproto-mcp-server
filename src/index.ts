// ── AT Protocol MCP Server ─────────────────────────────────────────────────
// Entry point for the Model Context Protocol server wrapping Bluesky's AT
// Protocol. Exposes moderation, social graph, discovery, and streaming
// capabilities as MCP tools consumable by LLM hosts.

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

// Resolve the Bluesky service URI. Falls back to the public, unauthenticated
// endpoint when no handle is provided — read-only mode.
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