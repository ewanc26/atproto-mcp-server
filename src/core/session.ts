// ── Session Management ─────────────────────────────────────────────────────
// Authenticate to a Bluesky PDS via handle/password, maintain a session
// refresh loop, and expose the underlying BskyAgent for downstream managers.
// Falls back to read-only mode (public API) when no credentials are set.

import { BskyAgent } from "@atproto/api";

export class SessionManager {
  private agent: BskyAgent;
  private refreshInterval: NodeJS.Timeout | null = null;
  private isAuthenticated: boolean = false;
  private handle: string | undefined;

  constructor(service: string) {
    this.agent = new BskyAgent({ service });
  }

  /** Authenticate from BSKY_HANDLE and BSKY_PASSWORD env vars. Silent no-op
   * when credentials are absent — the server runs in public read-only mode. */
  async login() {
    this.handle = process.env.BSKY_HANDLE;
    const password = process.env.BSKY_PASSWORD;

    if (this.handle && password) {
      try {
        await this.agent.login({ identifier: this.handle, password });
        this.isAuthenticated = true;
        console.error(`Authenticated successfully as ${this.handle}`);
        this.startRefreshLoop();
        return true;
      } catch (error: any) {
        console.error(`Authentication failed: ${error.message}`);
        this.isAuthenticated = false;
        return false;
      }
    } else {
      console.error("Running in read-only mode");
      return false;
    }
  }

  /** Refresh the AT Protocol session token every 30 minutes to prevent expiry.
   * Future: replace the stub with the actual session.refresh() call. */
  private startRefreshLoop() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(async () => {
      try {
        if (this.isAuthenticated) {
          console.error("Refreshing session...");
        }
      } catch (error: any) {
        console.error(`Token refresh failed: ${error.message}`);
        await this.login();
      }
    }, 30 * 60 * 1000);
  }

  getAgent() { return this.agent; }
  isAuth() { return this.isAuthenticated; }
}