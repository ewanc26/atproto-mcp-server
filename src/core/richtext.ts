import { Client } from '@atproto/lex';
import { RichText } from '@bsky/sdk/richtext';

export class RichTextManager {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async createRichText(text: string) {
    const rt = new RichText({ text });
    await rt.detectFacets(this.client);
    return rt;
  }

  addCustomFacet(rt: RichText, start: number, end: number, feature: any) {
    if (!rt.facets) rt.facets = [];
    rt.facets.push({
      index: { byteStart: start, byteEnd: end },
      features: [feature]
    });
    return rt;
  }
}
