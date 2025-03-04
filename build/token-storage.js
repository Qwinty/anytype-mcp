import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
export class TokenStorage {
    tokenFile;
    constructor(appName = 'AnytypeMCP') {
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
    saveTokens(tokens) {
        try {
            fs.writeFileSync(this.tokenFile, JSON.stringify(tokens, null, 2));
        }
        catch (error) {
            console.error('Failed to save tokens:', error);
        }
    }
    /**
     * Load saved tokens from file
     */
    loadTokens() {
        try {
            if (fs.existsSync(this.tokenFile)) {
                const data = fs.readFileSync(this.tokenFile, 'utf8');
                return JSON.parse(data);
            }
        }
        catch (error) {
            console.error('Failed to load tokens:', error);
        }
        return null;
    }
    /**
     * Clear saved tokens
     */
    clearTokens() {
        try {
            if (fs.existsSync(this.tokenFile)) {
                fs.unlinkSync(this.tokenFile);
            }
        }
        catch (error) {
            console.error('Failed to clear tokens:', error);
        }
    }
}
