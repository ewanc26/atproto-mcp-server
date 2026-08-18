import { Client } from '@atproto/lex';
import { RichText } from '@bsky/sdk/richtext';

export class AdvancedFacetManager {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async generateComplexFacets(text: string, customMappings: Array<{text: string, feature: any}>) {
    const rt = new RichText({ text });
    await rt.detectFacets(this.client);

    for (const mapping of customMappings) {
      const start = text.indexOf(mapping.text);
      if (start !== -1) {
        if (!rt.facets) rt.facets = [];
        rt.facets.push({
          index: { byteStart: start, byteEnd: start + mapping.text.length },
          features: [mapping.feature]
        });
      }
    }
    return rt;
  }
}
