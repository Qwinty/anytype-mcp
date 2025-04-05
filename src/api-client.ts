import axios from "axios";
import { TokenStorage } from "./token-storage.js";

interface AuthTokens {
  app_key: string;
  session_token: string;
}

export class AnytypeClient {
  private basePath: string;
  private accessToken: string = "";
  private tokenStorage: TokenStorage;

  constructor(
    basePath: string = "http://localhost:31009/v1",
    appName: string = "AnytypeMCP"
  ) {
    this.basePath = basePath;
    this.tokenStorage = new TokenStorage(appName);

    // Try to load saved tokens
    this.loadSavedTokens();
  }

  /**
   * Load saved tokens from storage if available
   * @returns true if tokens were loaded successfully
   */
  private loadSavedTokens(): boolean {
    const savedTokens = this.tokenStorage.loadTokens();
    if (savedTokens?.appKey) {
      this.accessToken = savedTokens.appKey;
      return true;
    }
    return false;
  }

  /**
   * Start the authentication process with Anytype
   * @param appName Name of your application
   * @returns Challenge ID to use with completeAuthentication
   */
  async startAuthentication(appName: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.basePath}/auth/display_code`,
        null, // No body needed if spec doesn't define one
        { params: { app_name: appName } }
      );

      if (!response.data?.challenge_id) {
        throw new Error("Failed to get challenge ID");
      }

      return response.data.challenge_id;
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Failed to start authentication");
    }
  }

  /**
   * Complete the authentication process using the challenge ID and display code
   * @param challengeId Challenge ID from startAuthentication
   * @param code Display code shown in Anytype desktop
   * @returns Authentication tokens
   */
  async completeAuthentication(
    challengeId: string,
    code: string
  ): Promise<AuthTokens> {
    try {
      const response = await axios.post(`${this.basePath}/auth/token`, null, {
        params: { challenge_id: challengeId, code: code },
      });

      if (!response.data?.session_token || !response.data?.app_key) {
        throw new Error("Authentication failed: No session token received");
      }

      const tokens: AuthTokens = {
        session_token: response.data.session_token,
        app_key: response.data.app_key,
      };

      // Save tokens for future use
      this.tokenStorage.saveTokens({
        sessionToken: tokens.session_token,
        appKey: tokens.app_key,
      });

      this.accessToken = tokens.app_key;
      return tokens;
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Failed to complete authentication");
    }
  }

  /**
   * Check if client has valid authentication tokens
   */
  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Clear saved authentication tokens
   */
  public logout(): void {
    this.accessToken = "";
    this.tokenStorage.clearTokens();
  }
}
