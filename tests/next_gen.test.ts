import { ModerationManager } from "../src/core/moderation.js";
import { StreamingManager } from "../src/core/streaming.js";
import { BskyAgent } from "@atproto/api";

/**
 * Next-Gen Feature Test Suite
 * Covers Moderation and Streaming (Jetstream) logic.
 */

async function runNextGenTests() {
  console.log("Starting Next-Gen Feature Tests (Moderation & Streaming)...");
  
  const agent = new BskyAgent({ service: "https://bsky.social" });
  const moderation = new ModerationManager(agent);
  const streaming = new StreamingManager(agent);

  try {
    // 1. Test Moderation Logic (Structure Check)
    console.log("Testing Moderation: Reporting logic...");
    if (typeof moderation.reportRepo !== 'function') throw new Error("reportRepo missing");
    if (typeof moderation.reportRecord !== 'function') throw new Error("reportRecord missing");
    console.log("✓ Moderation methods validated");

    // 2. Test Jetstream URL Generation
    console.log("Testing Streaming: Jetstream URL generation...");
    const url = streaming.getJetstreamUrl(['app.bsky.feed.post', 'app.bsky.graph.follow']);
    console.log(`Generated URL: ${url}`);
    
    if (!url.includes("wss://jetstream1.us-east.bsky.network/subscribe")) {
      throw new Error("Invalid Jetstream base URL");
    }
    if (!url.includes("wantedCollections=app.bsky.feed.post")) {
      throw new Error("Missing collection filter in URL");
    }
    console.log("✓ Jetstream URL logic validated");

    console.log("\n========================================");
    console.log("NEXT-GEN TESTS PASSED");
    console.log("========================================");

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Next-Gen Test failed: ${msg}`);
    process.exit(1);
  }
}

runNextGenTests();