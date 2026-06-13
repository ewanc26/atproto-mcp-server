import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BskyAgent } from "@atproto/api";

const server = new Server(
  {
    name: "atproto-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const agent = new BskyAgent({
  service: "https://bsky.social",
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_profile",
        description: "Get a user profile by handle or DID",
        inputSchema: {
          type: "object",
          properties: {
            actor: {
              type: "string",
              description: "Handle or DID of the user",
            },
          },
          required: ["actor"],
        },
      },
      {
        name: "resolve_handle",
        description: "Resolve a handle to a DID",
        inputSchema: {
          type: "object",
          properties: {
            handle: {
              type: "string",
              description: "Handle to resolve",
            },
          },
          required: ["handle"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "get_profile": {
      const actor = request.params.arguments?.actor as string;
      const response = await agent.getProfile({ actor });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }
    case "resolve_handle": {
      const handle = request.params.arguments?.handle as string;
      const response = await agent.resolveHandle({ handle });
      return {
        content: [
          {
            type: "text",
            text: response.data.did,
          },
        ],
      };
    }
    default:
      throw new Error("Unknown tool");
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
