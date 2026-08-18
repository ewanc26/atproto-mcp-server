import { Client } from '@atproto/lex';
import { com } from '@bsky/sdk/lexicons';
import { muteActor, unmuteActor } from '@bsky/sdk';

export class SocialManager {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async muteActor(actor: string) {
    return await this.client.call(muteActor, { actor });
  }

  async unmuteActor(actor: string) {
    return await this.client.call(unmuteActor, { actor });
  }

  async blockActor(did: string) {
    return await this.client.call(com.atproto.repo.createRecord, {
      repo: this.client.assertDid,
      collection: 'app.bsky.graph.block',
      record: { subject: did, createdAt: new Date().toISOString() }
    });
  }

  async createList(name: string, purpose: string, description?: string) {
    return await this.client.call(com.atproto.repo.createRecord, {
      repo: this.client.assertDid,
      collection: 'app.bsky.graph.list',
      record: { name, purpose, description, createdAt: new Date().toISOString() }
    });
  }

  async addToList(listUri: string, actorDid: string) {
    return await this.client.call(com.atproto.repo.createRecord, {
      repo: this.client.assertDid,
      collection: 'app.bsky.graph.listitem',
      record: { list: listUri, subject: actorDid, createdAt: new Date().toISOString() }
    });
  }
}
