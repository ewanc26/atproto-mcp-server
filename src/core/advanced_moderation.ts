import { Client } from '@atproto/lex';
import { app, com } from '@bsky/sdk/lexicons';

export class AdvancedModerationManager {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async queryOzoneLabels(subject: string, labelers: string[]) {
    const responses = await Promise.all(labelers.map(did =>
      this.client.call(com.atproto.label.queryLabels, {
        uriPatterns: [subject],
        sources: [did]
      })
    ));
    return responses.flatMap(r => r.labels);
  }

  async getLabelerProfile(did: string) {
    return await this.client.call(app.bsky.labeler.getServices, {
      dids: [did],
      detailed: true
    });
  }
}
