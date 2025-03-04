import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface AuthTokens {
  sessionToken: string;
  appKey: string;
}

export class TokenStorage {
  private tokenFile: string;

  constructor(appName: string = 'AnytypeMCP') {
    // Create a directory for storing tokens
    const configDir = path.join(os.homedir(), '.config', 'anytype-mcp');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Set the token file path
    this.tokenFile = path.join(configDir, `${appName.toLowerCase()}-tokens.json`);
  }

  /**
   * Save authentication tokens to file
   */
  public saveTokens(tokens: AuthTokens): void {
    try {
      fs.writeFileSync(this.tokenFile, JSON.stringify(tokens, null, 2));
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  /**
   * Load saved tokens from file
   */
  public loadTokens(): AuthTokens | null {
    try {
      if (fs.existsSync(this.tokenFile)) {
        const data = fs.readFileSync(this.tokenFile, 'utf8');
        return JSON.parse(data) as AuthTokens;
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
    return null;
  }

  /**
   * Clear saved tokens
   */
  public clearTokens(): void {
    try {
      if (fs.existsSync(this.tokenFile)) {
        fs.unlinkSync(this.tokenFile);
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }
}