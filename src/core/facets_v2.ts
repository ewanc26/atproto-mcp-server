// ── Rich-Text Facets (Enhanced) ────────────────────────────────────────────
// Extends @atproto/api's built-in facet detection with support for custom
// entity mappings beyond the auto-detected mentions, links, and tags.

import { BskyAgent, RichText } from "@atproto/api";

export class AdvancedFacetManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /**
   * Auto-detect facets (mentions, links, tags) and overlay custom entity
   * mappings on top. Custom mappings take textual ranges first-match-wins.
   */
  async generateComplexFacets(text: string, customMappings: Array<{text: string, feature: any}>) {
    const rt = new RichText({ text });
    await rt.detectFacets(this.agent);

    // Overlay custom facet mappings — first occurrence of each marker string.
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