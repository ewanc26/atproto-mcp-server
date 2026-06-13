import { BskyAgent } from "@atproto/api";

export class SocialManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  async muteActor(actor: string) {
    return await this.agent.app.bsky.graph.muteActor({ actor });
  }

  async unmuteActor(actor: string) {
    return await this.agent.app.bsky.graph.unmuteActor({ actor });
  }

  async blockActor(did: string) {
    return await this.agent.app.bsky.graph.block.create(
      { repo: this.agent.session?.did! },
      { subject: did, createdAt: new Date().toISOString() }
    );
  }

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