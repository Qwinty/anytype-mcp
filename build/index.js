#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AnytypeClient } from "./api-client.js";
// Get API key from environment variables
const APP_KEY = process.env.ANYTYPE_APP_KEY;
if (!APP_KEY) {
    console.error("ANYTYPE_APP_KEY environment variable is required");
    process.exit(1);
}
// Create Anytype client with the provided API key
const anytypeClient = new AnytypeClient('http://localhost:31009/v1', APP_KEY);
// Create MCP server
const server = new McpServer({
    name: "anytype-server",
    version: "1.0.0",
    description: "MCP server for Anytype API"
});
// Tool 1: List spaces
server.tool("get_spaces", {}, // No parameters needed
async () => {
    try {
        const spaces = await anytypeClient.getSpaces();
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(spaces, null, 2)
                }]
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{
                    type: "text",
                    text: `Error retrieving spaces: ${errorMessage}`
                }],
            isError: true
        };
    }
});
// Tool 2: List objects for a space
server.tool("get_objects", {
    space_id: z.string().describe("The ID of the space to get objects from"),
    query: z.string().optional().describe("Optional search query, defaults to empty string (all objects)"),
    offset: z.number().int().min(0).optional().describe("Pagination offset"),
    limit: z.number().int().min(1).max(100).optional().describe("Number of results per page")
}, async ({ space_id, query = '', offset = 0, limit = 50 }) => {
    try {
        const result = await anytypeClient.searchObjects(space_id, query, offset, limit);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{
                    type: "text",
                    text: `Error retrieving objects: ${errorMessage}`
                }],
            isError: true
        };
    }
});
// Tool 3: Get content of a specific object
server.tool("get_object_content", {
    space_id: z.string().describe("The ID of the space containing the object"),
    object_id: z.string().describe("The ID of the object to retrieve")
}, async ({ space_id, object_id }) => {
    try {
        const result = await anytypeClient.getObjectContent(space_id, object_id);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{
                    type: "text",
                    text: `Error retrieving object content: ${errorMessage}`
                }],
            isError: true
        };
    }
});
// Start the server with stdio transport
async function main() {
    console.error("Starting Anytype MCP server...");
    const transport = new StdioServerTransport();
    try {
        await server.connect(transport);
        console.error("Anytype MCP server running on stdio");
    }
    catch (error) {
        console.error("Error starting MCP server:", error);
        process.exit(1);
    }
}
main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});
