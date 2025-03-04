import axios from 'axios';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to get user input
const prompt = (question: string): Promise<string> => {
  return new Promise<string>(resolve => {
    rl.question(question, resolve);
  });
};

// Function to save tokens to file for easy access
const saveTokensToFile = (appKey: string) => {
  const configData = {
    appKey
  };
  
  try {
    const configDir = path.join(process.cwd(), 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const configPath = path.join(configDir, 'anytype-token.json');
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log(`Tokens saved to ${configPath}`);
    
    // Also show example MCP config
    console.log('\nAdd this to your MCP settings file:');
    console.log(JSON.stringify({
      mcpServers: {
        anytype: {
          command: "node",
          args: ["path/to/anytype-server/build/index.js"],
          env: {
            ANYTYPE_APP_KEY: appKey
          },
          disabled: false,
          alwaysAllow: []
        }
      }
    }, null, 2));
  } catch (error) {
    console.error('Error saving tokens:', error);
  }
};

async function main() {
  try {
    const basePath = 'http://localhost:31009/v1';
    const appName = 'AnytypeHelper';
    
    // Start authentication process
    console.log('Starting Anytype authentication...');
    
    // Step 1: Display code and get challenge ID
    const authResponse = await axios.post(
      `${basePath}/auth/display-code`,
      { app_name: appName }
    );
    
    if (!authResponse.data?.challenge_id) {
      throw new Error('Failed to get challenge ID');
    }
    
    const challengeId = authResponse.data.challenge_id;
    console.log('\nPlease check Anytype Desktop for the 4-digit code');
    
    // Step 2: Get code from user
    const code = await prompt('\nEnter the 4-digit code shown in Anytype Desktop: ');
    
    // Step 3: Complete authentication with challenge ID and code
    const tokenResponse = await axios.post(
      `${basePath}/auth/token`,
      { challenge_id: challengeId, code }
    );
    
    if (!tokenResponse.data?.app_key) {
      throw new Error('Authentication failed: No app key received');
    }
    
    console.log('\nAuthenticated successfully!');
    
    // Display the app key
    const appKey = tokenResponse.data.app_key;
    console.log('\nYour Anytype App Key:');
    console.log(`${appKey}`);
    
    // Save tokens to file
    saveTokensToFile(appKey);
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
  }
}

main();