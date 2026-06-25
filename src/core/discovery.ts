// ── Content Discovery ──────────────────────────────────────────────────────
// Feed exploration, timeline retrieval, and actor-specific content queries.
// Wraps Bluesky's unauthenticated and authenticated feed endpoints for
// downstream tool consumption.

import { BskyAgent } from "@atproto/api";

export class DiscoveryManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /** List popular feed generators for users to discover new content streams. */
  async findFeeds(limit: number = 25, cursor?: string) {
    return await this.agent.app.bsky.unspecced.getPopularFeedGenerators({
      limit,
      cursor,
    });
  }

  /** Retrieve posts an actor has liked. Requires authentication. */
  async getActorLikes(actor: string, limit: number = 25, cursor?: string) {
    return await this.agent.app.bsky.feed.getActorLikes({
      actor,
      limit,
      cursor,
    });
  }

  /** Fetch the authenticated user's home timeline. */
  async getTimeline(limit: number = 50, cursor?: string) {
    return await this.agent.app.bsky.feed.getTimeline({
      limit,
      cursor,
    });
  }
}