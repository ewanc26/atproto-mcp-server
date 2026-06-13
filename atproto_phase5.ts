import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { BskyAgent } from "@atproto/api";

/**
 * ATProto MCP Server - Phase 5: Protocol Layer (Record CRUD & Repo Mutations)
 * 
 * Features:
 * - Direct Record CRUD (put, get, delete) across any collection
 * - Repository inspection (listRecords, describeRepo)
 * - Lower-level AT Protocol access
 * - Robust Session Management (inherited from Phase 3/4)
 */

class SessionManager {
  private agent: BskyAgent;
  private isAuthenticated: boolean = false;

  constructor(service: string) {
    this.agent = new BskyAgent({ service });
  }

  async login() {
    const handle = process.env.BSKY_HANDLE;
    const password = process.env.BSKY_PASSWORD;
    if (handle && password) {
      try {
        await this.agent.login({ identifier: handle, password });
        this.isAuthenticated = true;
        console.error(`Authenticated as ${handle}`);
        return true;
      } catch (error: any) {
        console.error(`Login failed: ${error.message}`);
        return false;
      }
    }
    return false;
  }

  getAgent() { return this.agent; }
  isAuth() { return this.isAuthenticated; }
}

const BSKY_SERVICE = process.env.BSKY_SERVICE || "https://bsky.social";
const sessionManager = new SessionManager(BSKY_SERVICE);

const server = new Server(
  { name: "atproto-mcp-server", version: "1.6.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [
    {
      name: "repo_describe",
      description: "Get information about a repository (handle or DID).",
      inputSchema: {
        type: "object",
        properties: { repo: { type: "string" } },
        required: ["repo"],
      },
    },
    {
      name: "repo_list_records",
      description: "List records in a repository collection.",
      inputSchema: {
        type: "object",
        properties: {
          repo: { type: "string" },
          collection: { type: "string" },
          limit: { type: "number" },
          cursor: { type: "string" },
        },
        required: ["repo", "collection"],
      },
    },
  ];

  if (sessionManager.isAuth()) {
    tools.push(
      {
        name: "record_put",
        description: "Write a record to a repository. (Requires auth)",
        inputSchema: {
          type: "object",
          properties: {
            collection: { type: "string", description: "The NSID of the collection." },
            rkey: { type: "string", description: "The record key." },
            record: { type: "object", description: "The record data." },
            swapRecord: { type: "string", description: "Optional CID for optimistic locking." },
          },
          required: ["collection", "rkey", "record"],
        },
      },
      {
        name: "record_get",
        description: "Get a single record from a repository. (Requires auth)",
        inputSchema: {
          type: "object",
          properties: {
            repo: { type: "string" },
            collection: { type: "string" },
            rkey: { type: "string" },
          },
          required: ["repo", "collection", "rkey"],
        },
      },
      {
        name: "record_delete",
        description: "Delete a record from a repository. (Requires auth)",
        inputSchema: {
          type: "object",
          properties: {
            collection: { type: "string" },
            rkey: { type: "string" },
          },
          required: ["collection", "rkey"],
        },
      }
    );
  }

  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const agent = sessionManager.getAgent();

  try {
    switch (name) {
      case "repo_describe": {
        const res = await agent.com.atproto.repo.describeRepo({ repo: args?.repo as string });
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      }
      case "repo_list_records": {
        const res = await agent.com.atproto.repo.listRecords({
          repo: args?.repo as string,
          collection: args?.collection as string,
          limit: args?.limit as number,
          cursor: args?.cursor as string,
        });
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      }
      case "record_put": {
        if (!sessionManager.isAuth()) throw new McpError(ErrorCode.InvalidRequest, "Auth required");
        const res = await agent.com.atproto.repo.putRecord({
          repo: agent.session?.did!,
          collection: args?.collection as string,
          rkey: args?.rkey as string,
          record: args?.record as any,
          swapRecord: args?.swapRecord as string,
        });
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      }
      case "record_get": {
        const res = await agent.com.atproto.repo.getRecord({
          repo: args?.repo as string,
          collection: args?.collection as string,
          rkey: args?.rkey as string,
        });
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      }
      case "record_delete": {
        if (!sessionManager.isAuth()) throw new McpError(ErrorCode.InvalidRequest, "Auth required");
        await agent.com.atproto.repo.deleteRecord({
          repo: agent.session?.did!,
          collection: args?.collection as string,
          rkey: args?.rkey as string,
        });
        return { content: [{ type: "text", text: "Record deleted successfully." }] };
      }
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  await sessionManager.login();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ATProto MCP Server (Phase 5) running");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
