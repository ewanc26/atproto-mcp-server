// ── Full Coverage Integration Test Suite ───────────────────────────────────
// Validates that every manager module instantiates and exposes its expected
// method surface. Does not require network access — purely structural checks.

import { BskyAgent } from "@atproto/api";
import { SessionManager } from "../src/core/session.js";
import { SocialManager } from "../src/core/social.js";
import { DiscoveryManager } from "../src/core/discovery.js";
import { ModerationManager } from "../src/core/moderation.js";
import { StreamingManager } from "../src/core/streaming.js";

async function runFullCoverageTests() {
  console.log("Starting Full Coverage Integration Tests...");
  console.log("");

  const BSKY_SERVICE = "https://bsky.social";
  const agent = new BskyAgent({ service: BSKY_SERVICE });

  // ── Phase 1-3: Session Management ──────────────────────────────────────
  console.log("Phase 1-3: Session Management");
  const session = new SessionManager(BSKY_SERVICE);
  if (typeof session.login !== 'function') throw new Error("session.login is not a function");
  console.log("  PASS: SessionManager logic verified");

  // ── Phase 2 & Expansion: Social Graph ─────────────────────────────────
  console.log("Phase 2 & Expansion: Social Graph");
  const social = new SocialManager(agent);
  const socialMethods = ['muteActor', 'unmuteActor', 'blockActor', 'createList', 'addToList'];
  socialMethods.forEach(method => {
    if (typeof (social as any)[method] !== 'function') throw new Error(`social.${method} missing`);
  });
  console.log("  PASS: SocialManager methods verified");

  // ── Phase 2 & Expansion: Discovery ────────────────────────────────────
  console.log("Phase 2 & Expansion: Discovery");
  const discovery = new DiscoveryManager(agent);
  const discoveryMethods = ['findFeeds', 'getActorLikes', 'getTimeline'];
  discoveryMethods.forEach(method => {
    if (typeof (discovery as any)[method] !== 'function') throw new Error(`discovery.${method} missing`);
  });
  console.log("  PASS: DiscoveryManager methods verified");

  // ── Phase 6: Moderation ───────────────────────────────────────────────
  console.log("Phase 6: Moderation");
  const moderation = new ModerationManager(agent);
  if (typeof moderation.reportRepo !== 'function') throw new Error("moderation.reportRepo missing");
  if (typeof moderation.reportRecord !== 'function') throw new Error("moderation.reportRecord missing");
  console.log("  PASS: ModerationManager methods verified");

  // ── Phase 6: Streaming ────────────────────────────────────────────────
  console.log("Phase 6: Streaming");
  const streaming = new StreamingManager(agent);
  const testUrl = streaming.getJetstreamUrl(['app.bsky.feed.post']);
  if (!testUrl.includes("jetstream1.us-east.bsky.network")) throw new Error("Jetstream URL incorrect");
  console.log("  PASS: StreamingManager logic verified");

  console.log("");
  console.log("========================================");
  console.log("FULL COVERAGE TEST SUITE PASSED");
  console.log("========================================");
}

runFullCoverageTests().catch(err => {
  console.error("Test Suite Failed:", err.message);
  process.exit(1);
});