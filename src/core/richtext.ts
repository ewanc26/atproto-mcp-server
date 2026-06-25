// ── Rich Text (Facets) ─────────────────────────────────────────────────────
// Facet detection and custom facet injection for AT Protocol rich text.
// Spec: https://atproto.com/specs/richtext

import { BskyAgent, RichText } from "@atproto/api";

export class RichTextManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /** Create a RichText instance with auto-detected facets (mentions, links, tags). */
  async createRichText(text: string) {
    const rt = new RichText({ text });
    await rt.detectFacets(this.agent);
    return rt;
  }

  /** Manually append a facet at a given byte range. Caller is responsible for
   * ensuring the range does not conflict with auto-detected facets. */
  addCustomFacet(rt: RichText, start: number, end: number, feature: any) {
    if (!rt.facets) rt.facets = [];
    rt.facets.push({
      index: { byteStart: start, byteEnd: end },
      features: [feature]
    });
    return rt;
  }
}