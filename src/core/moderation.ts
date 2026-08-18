import { Client } from '@atproto/lex';
import { com } from '@bsky/sdk/lexicons';

export class ModerationManager {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async reportRepo(did: string, reasonType: string, reason?: string) {
    return await this.client.call(com.atproto.moderation.createReport, {
      subject: {
        $type: 'com.atproto.admin.defs#repoRef',
        did: did,
      },
      reasonType,
      reason,
    });
  }

  async reportRecord(uri: string, cid: string, reasonType: string, reason?: string) {
    return await this.client.call(com.atproto.moderation.createReport, {
      subject: {
        $type: 'com.atproto.repo.strongRef',
        uri,
        cid,
      },
      reasonType,
      reason,
    });
  }

  async getLabels(uri: string) {
    return await this.client.call(com.atproto.label.queryLabels, {
      uriPatterns: [uri]
    });
  }
}
