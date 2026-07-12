import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer, handlers, tools } from "../build/index.js";

test("every advertised MCP tool has a handler and names are unique", () => {
  const names = tools.map((tool) => tool.name);
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual(names.filter((name) => typeof handlers[name] !== "function"), []);
  assert.ok(names.length >= 10);
});

test("get_profile calls the ATProto agent and returns response data", async () => {
  const agent = {
    getProfile: async (params) => ({ data: { did: "did:plc:test", params } }),
  };
  const result = await handlers.get_profile({ actor: "alice.test" }, agent);
  assert.deepEqual(result, { did: "did:plc:test", params: { actor: "alice.test" } });
});

test("paginated tools validate limits and pass cursors", async () => {
  let received;
  const agent = {
    getFollowers: async (params) => { received = params; return { data: { followers: [] } }; },
  };
  await handlers.get_followers({ actor: "did:plc:test", limit: 10, cursor: "next" }, agent);
  assert.deepEqual(received, { actor: "did:plc:test", limit: 10, cursor: "next" });
  await assert.rejects(() => handlers.get_followers({ actor: "alice.test", limit: 101 }, agent), /limit/);
});

test("required string arguments reject empty values", async () => {
  await assert.rejects(() => handlers.resolve_handle({ handle: "" }, {}), /handle/);
  await assert.rejects(() => handlers.get_post_thread({}, {}), /uri/);
});

test("an MCP client can initialize, list tools, and call a tool", async (t) => {
  const agent = {
    getProfile: async ({ actor }) => ({ data: { did: "did:plc:test", handle: actor } }),
  };
  const server = createServer(agent);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  t.after(async () => { await client.close(); await server.close(); });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const listed = await client.listTools();
  assert.equal(listed.tools.length, tools.length);
  const called = await client.callTool({ name: "get_profile", arguments: { actor: "alice.test" } });
  assert.equal(called.isError, undefined);
  assert.deepEqual(JSON.parse(called.content[0].text), { did: "did:plc:test", handle: "alice.test" });
});
