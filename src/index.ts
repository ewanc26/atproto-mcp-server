import { BskyAgent, RichText } from "@atproto/api";
import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { SessionManager } from "./core/session.js";

const service = process.env.BSKY_SERVICE ||
  (process.env.BSKY_HANDLE ? "https://bsky.social" : "https://public.api.bsky.app");
const sessions = new SessionManager(service);

type Args = Record<string, unknown>;
type ToolHandler = (args: Args, agent: BskyAgent) => Promise<unknown>;

const string = (args: Args, name: string): string => {
  const value = args[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new McpError(ErrorCode.InvalidParams, `Expected non-empty string: ${name}`);
  }
  return value;
};

const optionalString = (args: Args, name: string): string | undefined => {
  const value = args[name];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    throw new McpError(ErrorCode.InvalidParams, `Expected non-empty string: ${name}`);
  }
  return value;
};

const limit = (args: Args, fallback = 25): number => {
  const value = args.limit ?? fallback;
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 100) {
    throw new McpError(ErrorCode.InvalidParams, "limit must be an integer from 1 to 100");
  }
  return value as number;
};

const requireAuth = () => {
  if (!sessions.isAuth()) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      "This tool requires BSKY_HANDLE and BSKY_PASSWORD (an app password is recommended).",
    );
  }
};

const objectSchema = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object" as const,
  properties,
  required,
  additionalProperties: false,
});
const text = { type: "string" };
const page = {
  limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
  cursor: { type: "string", description: "Cursor returned by a previous call" },
};

export const tools = [
  { name: "get_profile", description: "Get a Bluesky actor profile by handle or DID.", inputSchema: objectSchema({ actor: text }, ["actor"]) },
  { name: "resolve_handle", description: "Resolve an AT Protocol handle to a DID.", inputSchema: objectSchema({ handle: text }, ["handle"]) },
  { name: "search_posts", description: "Search public Bluesky posts.", inputSchema: objectSchema({ query: text, ...page, sort: { type: "string", enum: ["top", "latest"] } }, ["query"]) },
  { name: "get_author_feed", description: "Get posts and reposts from an actor.", inputSchema: objectSchema({ actor: text, ...page, filter: { type: "string", enum: ["posts_with_replies", "posts_no_replies", "posts_with_media", "posts_and_author_threads"] } }, ["actor"]) },
  { name: "get_post_thread", description: "Get a post thread and replies by AT URI.", inputSchema: objectSchema({ uri: text, depth: { type: "integer", minimum: 0, maximum: 100 }, parentHeight: { type: "integer", minimum: 0, maximum: 100 } }, ["uri"]) },
  { name: "get_suggestions", description: "Get suggested accounts to follow.", inputSchema: objectSchema(page) },
  { name: "get_timeline", description: "Get the authenticated account's home timeline.", inputSchema: objectSchema(page) },
  { name: "get_actor_likes", description: "Get posts liked by an actor.", inputSchema: objectSchema({ actor: text, ...page }, ["actor"]) },
  { name: "get_followers", description: "Get an actor's followers.", inputSchema: objectSchema({ actor: text, ...page }, ["actor"]) },
  { name: "get_follows", description: "Get accounts followed by an actor.", inputSchema: objectSchema({ actor: text, ...page }, ["actor"]) },
  { name: "create_post", description: "Create a Bluesky post. Requires authentication.", inputSchema: objectSchema({ text: { type: "string", minLength: 1 }, replyRootUri: text, replyRootCid: text, replyParentUri: text, replyParentCid: text }, ["text"]) },
  { name: "delete_post", description: "Delete one of the authenticated account's posts.", inputSchema: objectSchema({ uri: text }, ["uri"]) },
  { name: "follow", description: "Follow an actor by handle or DID. Returns the follow record URI.", inputSchema: objectSchema({ actor: text }, ["actor"]) },
  { name: "unfollow", description: "Delete a follow record by its AT URI.", inputSchema: objectSchema({ uri: text }, ["uri"]) },
  { name: "like", description: "Like a record using its AT URI and CID.", inputSchema: objectSchema({ uri: text, cid: text }, ["uri", "cid"]) },
  { name: "unlike", description: "Delete a like record by its AT URI.", inputSchema: objectSchema({ uri: text }, ["uri"]) },
] as const;

export const handlers: Record<string, ToolHandler> = {
  get_profile: async (a, agent) => (await agent.getProfile({ actor: string(a, "actor") })).data,
  resolve_handle: async (a, agent) => (await agent.resolveHandle({ handle: string(a, "handle") })).data,
  search_posts: async (a, agent) => (await agent.app.bsky.feed.searchPosts({
    q: string(a, "query"), limit: limit(a), cursor: optionalString(a, "cursor"),
    sort: optionalString(a, "sort") as "top" | "latest" | undefined,
  })).data,
  get_author_feed: async (a, agent) => (await agent.getAuthorFeed({
    actor: string(a, "actor"), limit: limit(a), cursor: optionalString(a, "cursor"),
    filter: optionalString(a, "filter") as "posts_with_replies" | "posts_no_replies" | "posts_with_media" | "posts_and_author_threads" | undefined,
  })).data,
  get_post_thread: async (a, agent) => (await agent.getPostThread({
    uri: string(a, "uri"), depth: a.depth as number | undefined,
    parentHeight: a.parentHeight as number | undefined,
  })).data,
  get_suggestions: async (a, agent) => (await agent.getSuggestions({ limit: limit(a), cursor: optionalString(a, "cursor") })).data,
  get_timeline: async (a, agent) => {
    requireAuth();
    return (await agent.getTimeline({ limit: limit(a, 50), cursor: optionalString(a, "cursor") })).data;
  },
  get_actor_likes: async (a, agent) => (await agent.app.bsky.feed.getActorLikes({ actor: string(a, "actor"), limit: limit(a), cursor: optionalString(a, "cursor") })).data,
  get_followers: async (a, agent) => (await agent.getFollowers({ actor: string(a, "actor"), limit: limit(a), cursor: optionalString(a, "cursor") })).data,
  get_follows: async (a, agent) => (await agent.getFollows({ actor: string(a, "actor"), limit: limit(a), cursor: optionalString(a, "cursor") })).data,
  create_post: async (a, agent) => {
    requireAuth();
    const rt = new RichText({ text: string(a, "text") });
    await rt.detectFacets(agent);
    const rootUri = optionalString(a, "replyRootUri");
    const rootCid = optionalString(a, "replyRootCid");
    const parentUri = optionalString(a, "replyParentUri");
    const parentCid = optionalString(a, "replyParentCid");
    const supplied = [rootUri, rootCid, parentUri, parentCid].filter(Boolean).length;
    if (supplied !== 0 && supplied !== 4) throw new McpError(ErrorCode.InvalidParams, "All four reply fields are required for a reply");
    return await agent.post({ text: rt.text, facets: rt.facets, createdAt: new Date().toISOString(),
      reply: supplied === 4 ? { root: { uri: rootUri!, cid: rootCid! }, parent: { uri: parentUri!, cid: parentCid! } } : undefined });
  },
  delete_post: async (a, agent) => { requireAuth(); await agent.deletePost(string(a, "uri")); return { deleted: true }; },
  follow: async (a, agent) => {
    requireAuth();
    const actor = string(a, "actor");
    const did = actor.startsWith("did:") ? actor : (await agent.resolveHandle({ handle: actor })).data.did;
    return await agent.follow(did);
  },
  unfollow: async (a, agent) => { requireAuth(); await agent.deleteFollow(string(a, "uri")); return { deleted: true }; },
  like: async (a, agent) => { requireAuth(); return await agent.like(string(a, "uri"), string(a, "cid")); },
  unlike: async (a, agent) => { requireAuth(); await agent.deleteLike(string(a, "uri")); return { deleted: true }; },
};

export function createServer(agent: BskyAgent = sessions.getAgent()) {
  const server = new Server({ name: "atproto-mcp-server", version: "2.1.0" }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...tools] }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const handler = handlers[request.params.name];
    if (!handler) throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    try {
      const result = await handler((request.params.arguments ?? {}) as Args, agent);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      if (error instanceof McpError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: message }] };
    }
  });
  return server;
}

async function main() {
  await sessions.login();
  await createServer().connect(new StdioServerTransport());
  console.error("ATProto MCP Server v2.1.0 running");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error("Fatal error:", error); process.exit(1); });
}
