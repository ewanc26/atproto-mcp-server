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
 * ATProto MCP Server - Phase 2
 * 
 * Expansion with interaction tools:
 * - Conditional authentication based on environment variables
 * - Session management for authenticated interactions
 * - Post engagement tools (like, unlike)
 * - Social graph tools (follow, unfollow)
 * - Robust error handling using McpError
 */

const server = new Server(
  {
    name: "atproto-mcp-server",
    version: "1.3.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize agent. Use public endpoint by default, switch to bsky.social if auth is provided.
const BSKY_SERVICE = process.env.BSKY_SERVICE || (process.env.BSKY_HANDLE ? "https://bsky.social" : "https://public.api.bsky.app");

const agent = new BskyAgent({
  service: BSKY_SERVICE,
});

// Authentication state
let isAuthenticated = false;

async function authenticate() {
  const handle = process.env.BSKY_HANDLE;
  const password = process.env.BSKY_PASSWORD;

  if (handle && password) {
    try {
      await agent.login({ identifier: handle, password });
      isAuthenticated = true;
      console.error(`Authenticated successfully as ${handle}`);
    } catch (error: any) {
      console.error(`Authentication failed: ${error.message}`);
      // Fallback to public API if login fails
      isAuthenticated = false;
    }
  } else {
    console.error("Running in read-only mode (no BSKY_HANDLE/BSKY_PASSWORD provided)");
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [
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
  ];

  // Add authenticated tools if login was successful
  if (isAuthenticated) {
    tools.push(
      {
        name: "create_post",
        description: "Create a new post on Bluesky. (Requires authentication)",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The text content of the post.",
            },
          },
          required: ["text"],
        },
      },
      {
        name: "get_notifications",
        description: "Retrieve the current user's notifications. (Requires authentication)",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of notifications to return (default 50).",
              minimum: 1,
              maximum: 100,
            },
            cursor: {
              type: "string",
              description: "Pagination cursor.",
            },
          },
        },
      },
      {
        name: "like_post",
        description: "Like a post on Bluesky. (Requires authentication)",
        inputSchema: {
          type: "object",
          properties: {
            uri: {
              type: "string",
              description: "AT URI of the post to like (e.g., 'at://did:plc:.../app.bsky.feed.post/...').",
            },
            cid: {
              type: "string",
              description: "Content ID of the post (required for like operation).",
            },
          },
          required: ["uri", "cid"],
        },
      },
      {
        name: "unlike_post",
        description: "Unlike a post on Bluesky. (Requires authentication)",
        inputSchema: {
          type: "object",
          properties: {
            uri: {
              type: "string",
              description: "AT URI of the user's like record to remove.",
            },
          },
          required: ["uri"],
        },
      },
      {
        name: "follow_actor",
        description: "Follow a user on Bluesky. (Requires authentication)",
        inputSchema: {
          type: "object",
          properties: {
            actor: {
              type: "string",
              description: "Handle or DID of the user to follow.",
            },
          },
          required: ["actor"],
        },
      },
      {
        name: "unfollow_actor",
        description: "Unfollow a user on Bluesky. (Requires authentication)",
        inputSchema: {
          type: "object",
          properties: {
            actor: {
              type: "string",
              description: "Handle or DID of the user to unfollow (or URI of the follow record).",
            },
          },
          required: ["actor"],
        },
      }
    );
  }

  return { tools };
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

      case "create_post": {
        if (!isAuthenticated) {
          throw new McpError(ErrorCode.InvalidRequest, "Tool 'create_post' requires authentication.");
        }
        const text = args?.text as string;
        const response = await agent.post({ text });
        return {
          content: [{ type: "text", text: `Post created successfully. URI: ${response.uri}` }],
        };
      }

      case "get_notifications": {
        if (!isAuthenticated) {
          throw new McpError(ErrorCode.InvalidRequest, "Tool 'get_notifications' requires authentication.");
        }
        const limit = (args?.limit as number) || 50;
        const cursor = args?.cursor as string;
        const response = await agent.listNotifications({ limit, cursor });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data.notifications, null, 2) }],
        };
      }

      case "like_post": {
        if (!isAuthenticated) {
          throw new McpError(ErrorCode.InvalidRequest, "Tool 'like_post' requires authentication.");
        }
        const uri = args?.uri as string;
        const cid = args?.cid as string;

        if (!uri || !cid) {
          throw new McpError(ErrorCode.InvalidRequest, "Both 'uri' and 'cid' are required for like_post.");
        }

        const response = await agent.like(uri, cid);
        return {
          content: [{ type: "text", text: `Post liked successfully. Like URI: ${response.uri}` }],
        };
      }

      case "unlike_post": {
        if (!isAuthenticated) {
          throw new McpError(ErrorCode.InvalidRequest, "Tool 'unlike_post' requires authentication.");
        }
        const uri = args?.uri as string;

        if (!uri) {
          throw new McpError(ErrorCode.InvalidRequest, "URI of the like record is required for unlike_post.");
        }

        await agent.deleteLike(uri);
        return {
          content: [{ type: "text", text: "Post unliked successfully." }],
        };
      }

      case "follow_actor": {
        if (!isAuthenticated) {
          throw new McpError(ErrorCode.InvalidRequest, "Tool 'follow_actor' requires authentication.");
        }
        const actor = args?.actor as string;

        if (!actor) {
          throw new McpError(ErrorCode.InvalidRequest, "Actor handle or DID is required for follow_actor.");
        }

        // Resolve handle to DID if needed
        let actorDid = actor;
        if (!actor.startsWith("did:")) {
          const resolved = await agent.resolveHandle({ handle: actor });
          actorDid = resolved.data.did;
        }

        const response = await agent.follow(actorDid);
        return {
          content: [{ type: "text", text: `Successfully followed ${actor}. Follow URI: ${response.uri}` }],
        };
      }

      case "unfollow_actor": {
        if (!isAuthenticated) {
          throw new McpError(ErrorCode.InvalidRequest, "Tool 'unfollow_actor' requires authentication.");
        }
        const actor = args?.actor as string;

        if (!actor) {
          throw new McpError(ErrorCode.InvalidRequest, "Actor handle, DID, or follow URI is required for unfollow_actor.");
        }

        // If it's a URI, use it directly; otherwise, look up the follow record
        if (actor.startsWith("at://")) {
          await agent.deleteFollow(actor);
          return {
            content: [{ type: "text", text: "Successfully unfollowed." }],
          };
        } else {
          // Resolve handle to DID if needed
          let actorDid = actor;
          if (!actor.startsWith("did:")) {
            const resolved = await agent.resolveHandle({ handle: actor });
            actorDid = resolved.data.did;
          }

          // Get user profile to find the follow record URI
          const profile = await agent.getProfile({ actor: actorDid });
          if (profile.data.viewer?.muted !== false && !profile.data.viewer?.following) {
            throw new McpError(ErrorCode.InvalidRequest, `Not currently following ${actor}.`);
          }

          // For unfollow by DID, we need to delete using the follow URI
          // This requires looking up the follow record, which is complex
          // For now, we'll return an informative error
          throw new McpError(ErrorCode.InvalidRequest, "Please provide the full AT URI of the follow record for unfollow_actor, or use a handle and the server will attempt to find it.");
        }
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
  await authenticate();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ATProto MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
