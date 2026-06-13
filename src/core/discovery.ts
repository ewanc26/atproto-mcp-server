import { BskyAgent } from "@atproto/api";

export class DiscoveryManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  async findFeeds(limit: number = 25, cursor?: string) {
    return await this.agent.app.bsky.unspecced.getPopularFeedGenerators({
      limit,
      cursor,
    });
  }

  async getActorLikes(actor: string, limit: number = 25, cursor?: string) {
    return await this.agent.app.bsky.feed.getActorLikes({
      actor,
      limit,
      cursor,
    });
  }

  async getTimeline(limit: number = 50, cursor?: string) {
    return await this.agent.app.bsky.feed.getTimeline({
      limit,
      cursor,
    });
  }
}