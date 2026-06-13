import { BskyAgent, RichText } from "@atproto/api";

export class RichTextManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  async createRichText(text: string) {
    const rt = new RichText({ text });
    await rt.detectFacets(this.agent);
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