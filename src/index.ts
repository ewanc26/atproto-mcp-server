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
 * ATProto MCP Server
 * 
 * Best Practices implemented:
 * - Use public.api.bsky.app for public/read-only requests (cached)
 * - Clear tool naming and detailed input schemas
 * - Robust error handling using McpError
 * - Pagination support for list tools
 */

const server = new Server(
  {
    name: "atproto-mcp-server",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Use the public, cached endpoint for read-only operations
const agent = new BskyAgent({
  service: "https://public.api.bsky.app",
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_profile",
        description: "Get detailed profile information for a Bluesky actor (handle or DID).",
        inputSchema: {
          type: "object",
          properties: {
            actor: {
              type: "string",
              description: "The handle or DID of the user to fetch.",
            },
          },
          required: ["actor"],
        },
      },
      {
        name: "resolve_handle",
        description: "Resolve a Bluesky handle to its persistent Decentralized Identifier (DID).",
        inputSchema: {
          type: "object",
          properties: {
            handle: {
              type: "string",
              description: "The handle to resolve (e.g., 'atproto.com').",
            },
          },
          required: ["handle"],
        },
      },
      {
        name: "search_posts",
        description: "Search for public posts on Bluesky using keywords or phrases.",
        inputSchema: {
          type: "object",
          properties: {
            q: {
              type: "string",
              description: "Search query string.",
            },
            limit: {
              type: "number",
              description: "Number of posts to return (default 25, max 100).",
              minimum: 1,
              maximum: 100,
            },
          },
          required: ["q"],
        },
      },
      {
        name: "get_author_feed",
        description: "Retrieve the post feed for a specific author.",
        inputSchema: {
          type: "object",
          properties: {
            actor: {
              type: "string",
              description: "Handle or DID of the author.",
            },
            limit: {
              type: "number",
              description: "Number of feed items to return (default 50).",
              minimum: 1,
              maximum: 100,
            },
            cursor: {
              type: "string",
              description: "Pagination cursor.",
            },
          },
          required: ["actor"],
        },
      },
      {
        name: "get_post_thread",
        description: "Get a specific post and its surrounding conversation thread.",
        inputSchema: {
          type: "object",
          properties: {
            uri: {
              type: "string",
              description: "AT URI of the post.",
            },
            depth: {
              type: "number",
              description: "How many levels of replies to include (default 6).",
            },
          },
          required: ["uri"],
        },
      },
      {
        name: "get_suggestions",
        description: "Get suggested actors to follow.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of suggestions (default 50).",
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_profile": {
        const actor = args?.actor as string;
        const response = await agent.getProfile({ actor });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      }

      case "resolve_handle": {
        const handle = args?.handle as string;
        const response = await agent.resolveHandle({ handle });
        return {
          content: [{ type: "text", text: response.data.did }],
        };
      }

      case "search_posts": {
        const q = args?.q as string;
        const limit = (args?.limit as number) || 25;
        const response = await agent.app.bsky.feed.searchPosts({ q, limit });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data.posts, null, 2) }],
        };
      }

      case "get_author_feed": {
        const actor = args?.actor as string;
        const limit = (args?.limit as number) || 50;
        const cursor = args?.cursor as string;
        const response = await agent.getAuthorFeed({ actor, limit, cursor });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      }

      case "get_post_thread": {
        const uri = args?.uri as string;
        const depth = (args?.depth as number) || 6;
        const response = await agent.getPostThread({ uri, depth });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data.thread, null, 2) }],
        };
      }

      case "get_suggestions": {
        const limit = (args?.limit as number) || 50;
        const response = await agent.app.bsky.actor.getSuggestions({ limit });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data.actors, null, 2) }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error: any) {
    console.error(`Error in tool ${name}:`, error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message || "An unknown error occurred"}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ATProto MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
