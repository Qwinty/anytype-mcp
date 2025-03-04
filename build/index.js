#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
// Main MCP server class
class AnytypeServer {
    server;
    apiBaseUrl = 'http://localhost:31009/v1';
    appKey;
    constructor() {
        // Get app key from environment variable
        this.appKey = process.env.ANYTYPE_APP_KEY || '';
        if (!this.appKey) {
            console.error('Error: ANYTYPE_APP_KEY environment variable is required');
            process.exit(1);
        }
        // Create MCP server
        this.server = new McpServer({
            name: "Anytype API Server",
            version: "1.0.0"
        });
        this.configureTools();
    }
    configureTools() {
        // Tool 1: Get spaces
        this.server.tool("get_spaces", {}, // Empty params schema
        async (_) => {
            try {
                const response = await this.makeRequest('get', '/spaces');
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response.data, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
        // Tool 2: Get objects in a space
        this.server.tool("get_objects", {
            space_id: z.string().describe("Space ID to get objects from"),
            query: z.string().optional().default('').describe("Search query (empty for all objects)"),
            offset: z.number().optional().default(0).describe("Pagination offset"),
            limit: z.number().optional().default(50).describe("Number of results per page (1-1000)")
        }, async ({ space_id, query, offset, limit }) => {
            try {
                // Validate limit
                const validLimit = Math.max(1, Math.min(1000, limit));
                // Use search endpoint as a workaround since it works better
                const response = await this.makeRequest('post', `/spaces/${space_id}/search`, {
                    query
                }, { offset, limit: validLimit });
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response.data, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
        // Tool 3: Get object content
        this.server.tool("get_object_content", {
            space_id: z.string().describe("Space ID containing the object"),
            object_id: z.string().describe("Object ID to retrieve")
        }, async ({ space_id, object_id }) => {
            try {
                const response = await this.makeRequest('get', `/spaces/${space_id}/objects/${object_id}`);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response.data, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
        // Tool 4: Create a new space
        this.server.tool("create_space", {
            name: z.string().describe("Name for the new space")
        }, async ({ name }) => {
            try {
                const response = await this.makeRequest('post', '/spaces', { name });
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response.data, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
        // Tool 5: Create a new object in a space
        this.server.tool("create_object", {
            space_id: z.string().describe("Space ID to create the object in"),
            name: z.string().describe("Object name"),
            object_type_unique_key: z.string().describe("Type of object to create (e.g. 'ot-page')"),
            description: z.string().optional().describe("Object description"),
            icon: z.string().optional().describe("Object icon"),
            body: z.string().optional().describe("Object body/content (you can use Markdown here)"),
            template_id: z.string().optional().describe("Template ID to use")
        }, async ({ space_id, name, object_type_unique_key, description, icon, body, template_id }) => {
            try {
                const createObj = {
                    name,
                    object_type_unique_key
                };
                if (description)
                    createObj.description = description;
                if (icon)
                    createObj.icon = icon;
                if (body)
                    createObj.body = body;
                if (template_id)
                    createObj.template_id = template_id;
                const response = await this.makeRequest('post', `/spaces/${space_id}/objects`, createObj);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response.data, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
        // Tool 6: Delete an object
        this.server.tool("delete_object", {
            space_id: z.string().describe("Space ID containing the object"),
            object_id: z.string().describe("Object ID to delete")
        }, async ({ space_id, object_id }) => {
            try {
                const response = await this.makeRequest('delete', `/spaces/${space_id}/objects/${object_id}`);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response.data, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
        // Tool 7: Export an object as markdown or protobuf
        this.server.tool("export_object", {
            space_id: z.string().describe("Space ID containing the object"),
            object_id: z.string().describe("Object ID to export"),
            format: z.enum(['markdown', 'protobuf']).describe("Export format")
        }, async ({ space_id, object_id, format }) => {
            try {
                const response = await this.makeRequest('post', `/spaces/${space_id}/objects/${object_id}/export/${format}`);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response.data, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
        // Tool 8: Get space members
        this.server.tool("get_space_members", {
            space_id: z.string().describe("Space ID to get members from"),
            offset: z.number().optional().default(0).describe("Pagination offset"),
            limit: z.number().optional().default(100).describe("Number of results per page (1-1000)")
        }, async ({ space_id, offset, limit }) => {
            try {
                // Validate limit
                const validLimit = Math.max(1, Math.min(1000, limit));
                const response = await this.makeRequest('get', `/spaces/${space_id}/members`, null, { offset, limit: validLimit });
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response.data, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
        // Tool 9: Get types in a space
        this.server.tool("get_types", {
            space_id: z.string().describe("Space ID to get types from"),
            offset: z.number().optional().default(0).describe("Pagination offset"),
            limit: z.number().optional().default(100).describe("Number of results per page (1-1000)")
        }, async ({ space_id, offset, limit }) => {
            try {
                // Validate limit
                const validLimit = Math.max(1, Math.min(1000, limit));
                const response = await this.makeRequest('get', `/spaces/${space_id}/types`, null, { offset, limit: validLimit });
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response.data, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
        // Tool 10: Get type details
        this.server.tool("get_type_details", {
            space_id: z.string().describe("Space ID containing the type"),
            type_id: z.string().describe("Type ID to retrieve details for")
        }, async ({ space_id, type_id }) => {
            try {
                const response = await this.makeRequest('get', `/spaces/${space_id}/types/${type_id}`);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response.data, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
        // Tool 11: Get templates for a type
        this.server.tool("get_templates", {
            space_id: z.string().describe("Space ID containing the type"),
            type_id: z.string().describe("Type ID to get templates for"),
            offset: z.number().optional().default(0).describe("Pagination offset"),
            limit: z.number().optional().default(100).describe("Number of results per page (1-1000)")
        }, async ({ space_id, type_id, offset, limit }) => {
            try {
                // Validate limit
                const validLimit = Math.max(1, Math.min(1000, limit));
                const response = await this.makeRequest('get', `/spaces/${space_id}/types/${type_id}/templates`, null, { offset, limit: validLimit });
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response.data, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
        // Tool 12: Get template details
        this.server.tool("get_template_details", {
            space_id: z.string().describe("Space ID containing the template"),
            type_id: z.string().describe("Type ID for the template"),
            template_id: z.string().describe("Template ID to retrieve details for")
        }, async ({ space_id, type_id, template_id }) => {
            try {
                const response = await this.makeRequest('get', `/spaces/${space_id}/types/${type_id}/templates/${template_id}`);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response.data, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
    }
    // Helper method to make authenticated API requests
    async makeRequest(method, endpoint, data, params) {
        try {
            const config = {
                method,
                url: `${this.apiBaseUrl}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${this.appKey}`,
                    'Content-Type': 'application/json'
                },
                data,
                params
            };
            return await axios(config);
        }
        catch (error) {
            console.error(`API request error: ${error}`);
            throw error;
        }
    }
    // Helper to handle API errors in a consistent way
    handleApiError(error) {
        const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown API error';
        return {
            content: [{
                    type: "text",
                    text: `Error: ${errorMessage}`
                }],
            isError: true
        };
    }
    // Start the server
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Anytype MCP server started on stdio');
    }
}
// Create and start the server
const server = new AnytypeServer();
server.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
