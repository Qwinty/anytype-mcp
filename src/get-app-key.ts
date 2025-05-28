#!/usr/bin/env node
import { AnytypeClient } from "./api-client.js";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to get user input
const prompt = (question: string): Promise<string> => {
  return new Promise<string>((resolve) => {
    rl.question(question, resolve);
  });
};

async function main() {
  const appName = "AnytypeMCP";
  const client = new AnytypeClient("http://localhost:31009/v1", appName);

  try {
    // Start authentication flow
    console.log("Starting authentication to get app key...");

    // Initiate authentication and get challenge ID
    const challengeId = await client.startAuthentication(appName);
    console.log("Please check Anytype Desktop for the 4-digit code");

    // Get code from user
    const code = await prompt(
      "Enter the 4-digit code shown in Anytype Desktop: "
    );

    // Complete authentication with challenge ID and code
    const tokens = await client.completeAuthentication(challengeId, code);
    console.log("Authenticated successfully!");

    // Get app key from tokens
    const appKey = tokens.app_key;

    if (!appKey) {
      throw new Error("Failed to get app key");
    }

    console.log(`\nYour APP KEY: ${appKey}`);
    console.log("\nAdd this to your MCP settings file as:");
    console.log(`
{
  "mcpServers": {
    "anytype": {
      "command": "node",
      "args": ["<PATH_TO_ANYTYPE_MCP>/build/index.js"],
      "env": {
        "ANYTYPE_APP_KEY": "${appKey}"
      },
      "disabled": false
    }
  }
}
`);
  } catch (error) {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("econnrefused") ||
        errorMessage.includes("enotfound") ||
        errorMessage.includes("unreachable") ||
        (error.name === "TypeError" && errorMessage.includes("failed to fetch")) // Common browser/node fetch error
      ) {
        console.error(
          `Error: Could not connect to the Anytype daemon at http://localhost:31009/v1. Please ensure Anytype is running and accessible.`
        );
      } else {
        console.error("Error:", error.message);
      }
    } else {
      console.error("An unknown error occurred:", error);
    }
  } finally {
    rl.close();
  }
}

main();
