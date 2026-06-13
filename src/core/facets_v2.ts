import { BskyAgent, RichText } from "@atproto/api";

export class AdvancedFacetManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  async generateComplexFacets(text: string, customMappings: Array<{text: string, feature: any}>) {
    const rt = new RichText({ text });
    await rt.detectFacets(this.agent);
    
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