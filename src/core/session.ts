import { Client } from '@atproto/lex';
import { PasswordSession } from '@atproto/lex-password-session';

export class SessionManager {
  private client: Client;
  private session: PasswordSession | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private isAuthenticated: boolean = false;
  private handle: string | undefined;
  private serviceUrl: string;

  constructor(service: string) {
    this.serviceUrl = service;
    this.client = new Client({ service });
  }

  async login() {
    this.handle = process.env.BSKY_HANDLE;
    const password = process.env.BSKY_PASSWORD;

    if (this.handle && password) {
      try {
        const session = await PasswordSession.login({
          service: this.serviceUrl,
          identifier: this.handle,
          password,
        });
        this.session = session;
        this.client = new Client(session);
        this.isAuthenticated = true;
        console.error(`Authenticated successfully as ${this.handle}`);
        this.startRefreshLoop();
        return true;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Authentication failed: ${message}`);
        this.isAuthenticated = false;
        return false;
      }
    } else {
      console.error("Running in read-only mode");
      return false;
    }
  }

  private startRefreshLoop() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(async () => {
      try {
        if (this.isAuthenticated && this.session && !this.session.destroyed) {
          console.error("Refreshing session...");
          await this.session.refresh();
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Token refresh failed: ${message}`);
        await this.login();
      }
    }, 30 * 60 * 1000);
  }

  getClient() { return this.client; }
  getSession() { return this.session; }
  isAuth() { return this.isAuthenticated; }
}
