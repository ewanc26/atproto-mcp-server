// ── Social Graph ───────────────────────────────────────────────────────────
// Mute, block, and list management for AT Protocol social graph operations.
// All write operations require an authenticated session.

import { BskyAgent } from "@atproto/api";

export class SocialManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /** Mute an actor by handle. Their posts will no longer appear in your feed. */
  async muteActor(actor: string) {
    return await this.agent.app.bsky.graph.muteActor({ actor });
  }

  /** Unmute a previously muted actor. */
  async unmuteActor(actor: string) {
    return await this.agent.app.bsky.graph.unmuteActor({ actor });
  }

  /** Block an actor by DID. This also prevents them from seeing your content. */
  async blockActor(did: string) {
    return await this.agent.app.bsky.graph.block.create(
      { repo: this.agent.session?.did! },
      { subject: did, createdAt: new Date().toISOString() }
    );
  }

  /** Create a new moderation or curation list. Purpose should be one of the
   * AT Protocol-defined list purposes (e.g. app.bsky.graph.defs#modlist). */
  async createList(name: string, purpose: string, description?: string) {
    return await this.agent.app.bsky.graph.list.create(
      { repo: this.agent.session?.did! },
      {
        name,
        purpose,
        description,
        createdAt: new Date().toISOString(),
      }
    );
  }

  /** Add an actor to a moderation/curation list. */
  async addToList(listUri: string, actorDid: string) {
    return await this.agent.app.bsky.graph.listitem.create(
      { repo: this.agent.session?.did! },
      {
        list: listUri,
        subject: actorDid,
        createdAt: new Date().toISOString(),
      }
    );
  }
}