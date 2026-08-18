import { Client } from '@atproto/lex';
import { com } from '@bsky/sdk/lexicons';

export class CustomLabelManager {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async applySelfLabel(labels: string[]) {
    return labels.map(val => ({ val }));
  }

  async getLabelDefinitions(labelValues: string[]) {
    return await this.client.call(com.atproto.label.queryLabels, {
      uriPatterns: labelValues.map(v => `*${v}*`)
    });
  }
}
