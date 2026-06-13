import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { BskyAgent, RichText } from "@atproto/api";
import * as fs from 'fs';

/**
 * ATProto MCP Server - Phase 4: Media & Embedding
 * 
 * Features:
 * - BlobManager for image uploads and media management
 * - Support for External Link Cards (og:tags simulation/embedding)
 * - Quote Post support via record embeds
 * - Integrated rich content with media attachments
 */

class SessionManager {
  private agent: BskyAgent;
  private refreshInterval: NodeJS.Timeout | null = null;
  private isAuthenticated: boolean = false;
  private handle: string | undefined;

  constructor(service: string) {
    this.agent = new BskyAgent({ service });
  }

  async login() {
    this.handle = process.env.BSKY_HANDLE;
    const password = process.env.BSKY_PASSWORD;

    if (this.handle && password) {
      try {
        await this.agent.login({ identifier: this.handle, password });
        this.isAuthenticated = true;
        console.error(`Authenticated successfully as ${this.handle}`);
        this.startRefreshLoop();
        return true;
      } catch (error: any) {
        console.error(`Authentication failed: ${error.message}`);
        this.isAuthenticated = false;
        return false;
      }
    }
    return false;
  }

  private startRefreshLoop() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(async () => {
      try {
        if (this.isAuthenticated) {
          console.error("Heartbeat: Session active");
        }
      } catch (error: any) {
        await this.login();
      }
    }, 30 * 60 * 1000);
  }

  getAgent() { return this.agent; }
  isAuth() { return this.isAuthenticated; }
}

const BSKY_SERVICE = process.env.BSKY_SERVICE || (process.env.BSKY_HANDLE ? "https://bsky.social" : "https://public.api.bsky.app");
const sessionManager = new SessionManager(BSKY_SERVICE);

const server = new Server(
  {
    name: "atproto-mcp-server",
    version: "1.5.0",
  },
  {
    capabilities: { tools: {} },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [
    {
      name: "get_profile",
      description: "Get profile info.",
      inputSchema: {
        type: "object",
        properties: { actor: { type: "string" } },
        required: ["actor"],
      },
    },
  ];

  if (sessionManager.isAuth()) {
    tools.push(
      {
        name: "upload_media",
        description: "Upload an image to Bluesky to get a blob reference. (Requires auth)",
        inputSchema: {
          type: "object",
          properties: {
            filePath: { type: "string", description: "Path to the image file." },
            mimeType: { type: "string", description: "MIME type (e.g. image/jpeg)." },
          },
          required: ["filePath", "mimeType"],
        },
      },
      {
        name: "post_with_media",
        description: "Create a post with image attachments and alt text. (Requires auth)",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string" },
            images: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  blob: { type: "object", description: "The blob object returned from upload_media." },
                  alt: { type: "string", description: "Alt text for accessibility." },
                },
                required: ["blob", "alt"],
              },
            },
          },
          required: ["text", "images"],
        },
      },
      {
        name: "post_quote",
        description: "Quote an existing post. (Requires auth)",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "Your commentary." },
            quoteUri: { type: "string", description: "URI of the post to quote." },
            quoteCid: { type: "string", description: "CID of the post to quote." },
          },
          required: ["text", "quoteUri", "quoteCid"],
        },
      },
      {
        name: "post_external",
        description: "Post a link with a rich external card. (Requires auth)",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string" },
            external: {
              type: "object",
              properties: {
                uri: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                thumbBlob: { type: "object", description: "Optional thumb blob." },
              },
              required: ["uri", "title", "description"],
            },
          },
          required: ["text", "external"],
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
      case "get_profile": {
        const response = await agent.getProfile({ actor: args?.actor as string });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      }

      case "upload_media": {
        if (!sessionManager.isAuth()) throw new McpError(ErrorCode.InvalidRequest, "Auth required");
        const path = args?.filePath as string;
        const mime = args?.mimeType as string;
        const fileData = fs.readFileSync(path);
        const response = await agent.uploadBlob(fileData, { encoding: mime });
        return { content: [{ type: "text", text: JSON.stringify(response.data.blob, null, 2) }] };
      }

      case "post_with_media": {
        if (!sessionManager.isAuth()) throw new McpError(ErrorCode.InvalidRequest, "Auth required");
        const text = args?.text as string;
        const images = args?.images as any[];
        const rt = new RichText({ text });
        await rt.detectFacets(agent);
        
        const response = await agent.post({
          text: rt.text,
          facets: rt.facets,
          embed: {
            $type: 'app.bsky.embed.images',
            images: images.map(img => ({
              image: img.blob,
              alt: img.alt
            }))
          }
        });
        return { content: [{ type: "text", text: `Post with media created: ${response.uri}` }] };
      }

      case "post_quote": {
        if (!sessionManager.isAuth()) throw new McpError(ErrorCode.InvalidRequest, "Auth required");
        const text = args?.text as string;
        const rt = new RichText({ text });
        await rt.detectFacets(agent);
        
        const response = await agent.post({
          text: rt.text,
          facets: rt.facets,
          embed: {
            $type: 'app.bsky.embed.record',
            record: {
              uri: args?.quoteUri as string,
              cid: args?.quoteCid as string,
            }
          }
        });
        return { content: [{ type: "text", text: `Quote post created: ${response.uri}` }] };
      }

      case "post_external": {
        if (!sessionManager.isAuth()) throw new McpError(ErrorCode.InvalidRequest, "Auth required");
        const text = args?.text as string;
        const ext = args?.external as any;
        const rt = new RichText({ text });
        await rt.detectFacets(agent);
        
        const response = await agent.post({
          text: rt.text,
          facets: rt.facets,
          embed: {
            $type: 'app.bsky.embed.external',
            external: {
              uri: ext.uri,
              title: ext.title,
              description: ext.description,
              thumb: ext.thumbBlob
            }
          }
        });
        return { content: [{ type: "text", text: `External link post created: ${response.uri}` }] };
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
  console.error("ATProto MCP Server (Phase 4) running");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
