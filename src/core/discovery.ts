import { Client } from '@atproto/lex';
import { app } from '@bsky/sdk/lexicons';

export class DiscoveryManager {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async findFeeds(limit: number = 25, cursor?: string) {
    return await this.client.call(app.bsky.unspecced.getPopularFeedGenerators, {
      limit,
      cursor,
    });
  }

  async getActorLikes(actor: string, limit: number = 25, cursor?: string) {
    return await this.client.call(app.bsky.feed.getActorLikes, {
      actor,
      limit,
      cursor,
    });
  }

  async getTimeline(limit: number = 50, cursor?: string) {
    return await this.client.call(app.bsky.feed.getTimeline, {
      limit,
      cursor,
    });
  }
}
