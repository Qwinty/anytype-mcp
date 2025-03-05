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
        this.server.tool("get_spaces", "Retrieves all available Anytype spaces for the current user. This tool returns a list of spaces with their IDs, names, and other metadata. Use this tool to get an overview of all spaces or to find a specific space ID for use with other tools. No parameters are required.", {}, // Empty params schema
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
        this.server.tool("get_objects", "Searches for and retrieves objects within a specified Anytype space. This tool allows you to list all objects or filter them using a search query. Results are paginated for better performance with large spaces. Use this tool to discover objects within a space, find specific objects by name, or browse through collections of objects.", {
            space_id: z.string().describe("Space ID to get objects from"),
            query: z.string().optional().default('').describe("Search query (empty for all objects)"),
            offset: z.number().optional().default(0).describe("Pagination offset"),
            limit: z.number().optional().default(50).describe("Number of results per page (1-1000)"),
            full_response: z.boolean().optional().default(false).describe("Set to true to get full unfiltered response"),
            include_text: z.boolean().optional().default(false).describe("Set to true to include full text content from blocks")
        }, async ({ space_id, query, offset, limit, full_response, include_text }) => {
            try {
                // Validate limit
                const validLimit = Math.max(1, Math.min(1000, limit));
                // Use search endpoint as a workaround since it works better
                const response = await this.makeRequest('post', `/spaces/${space_id}/search`, {
                    query
                }, { offset, limit: validLimit });
                // Decide how to process the response data based on parameters
                let responseData;
                if (full_response) {
                    // Return unfiltered data if full_response is true
                    responseData = response.data;
                }
                else {
                    // Filter the response data to remove unnecessary information
                    responseData = this.filterObjectsData(response.data, include_text);
                }
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(responseData, null, 2)
                        }]
                };
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
        // Tool 3: Get object content
        this.server.tool("get_object_content", "Retrieves detailed content and metadata for a specific object in an Anytype space. This tool provides comprehensive information about an object including its properties, relations, and content. Use this tool when you need to examine a specific object's details after discovering its ID through the get_objects tool.", {
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
        this.server.tool("create_space", "Creates a new Anytype space with the specified name. This tool allows you to set up a fresh workspace for organizing objects and collaborating with others. Use this tool when you need to establish a new organizational container for your Anytype content.", {
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
        this.server.tool("create_object", "Creates a new object within a specified Anytype space. This tool allows you to add various types of content (pages, notes, tasks, etc.) to your spaces. You can specify the object's name, type, description, icon, and content. Optionally, you can use a template to create pre-structured objects. Use this tool when you need to add new content to an existing space.", {
            space_id: z.string().describe("Space ID to create the object in"),
            name: z.string().describe("Object name"),
            object_type_unique_key: z.string().describe("Type of object to create (e.g. 'ot-page')"),
            description: z.string().optional().describe("Object description"),
            icon: z.string().optional().describe("Object icon"),
            body: z.string().optional().describe("Object body/content"),
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
        this.server.tool("delete_object", "Permanently removes an object from a specified Anytype space. This tool deletes the object and all its content. Use this tool with caution as deleted objects cannot be recovered. Always verify the object ID before deletion to avoid removing important content.", {
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
        this.server.tool("export_object", "Exports an Anytype object in either Markdown or Protobuf format. This tool allows you to extract content from Anytype for use in other applications or for backup purposes. Markdown format is human-readable and suitable for documentation, while Protobuf format preserves more structural information. Use this tool when you need to share Anytype content with external systems or create portable backups.", {
            space_id: z.string().describe("Space ID containing the object"),
            object_id: z.string().describe("Object ID to export"),
            format: z.enum(['markdown', 'protobuf']).describe("Export format"),
            path: z.string().optional().describe("Path for export (directory path without file name)")
        }, async ({ space_id, object_id, format, path }) => {
            try {
                // Создаем payload с путем для экспорта, если он указан
                const payload = path ? { path } : undefined;
                const response = await this.makeRequest('post', `/spaces/${space_id}/objects/${object_id}/export/${format}`, payload);
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
        this.server.tool("get_space_members", "Retrieves a list of all members who have access to a specified Anytype space. This tool provides information about each member including their ID, name, and access level. Results are paginated for spaces with many members. Use this tool when you need to understand who has access to a space or manage collaboration permissions.", {
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
        this.server.tool("get_types", "Retrieves all object types available in a specified Anytype space. This tool provides information about the different types of objects that can be created in the space, including their IDs, names, and metadata. Results are paginated for spaces with many types. Use this tool when you need to understand what types of objects can be created or to find the correct type ID for creating new objects.", {
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
        this.server.tool("get_type_details", "Retrieves detailed information about a specific object type in an Anytype space. This tool provides comprehensive details about the type's structure, including its relations, views, and configuration options. Use this tool when you need to understand the structure of a particular object type or to examine its available relations and properties.", {
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
        this.server.tool("get_templates", "Retrieves all available templates for a specific object type in an Anytype space. Templates provide pre-configured structures and content for creating new objects. This tool returns a list of templates with their IDs, names, and metadata. Results are paginated for types with many templates. Use this tool when you need to find appropriate templates for creating new objects of a specific type.", {
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
        this.server.tool("get_template_details", "Retrieves detailed information about a specific template in an Anytype space. This tool provides comprehensive details about the template's structure, content, and configuration. Use this tool when you need to examine a template's properties before using it to create new objects, or to understand how a particular template is structured.", {
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
    // Filter objects data to remove unnecessary information
    filterObjectsData(data, includeText = false) {
        if (!data || !data.data || !Array.isArray(data.data)) {
            return data;
        }
        const filteredObjects = data.data.map((obj) => {
            // Create a simplified object with only essential information
            const simplified = {
                id: obj.id,
                type: obj.type,
                name: obj.name,
                icon: obj.icon,
                layout: obj.layout,
                space_id: obj.space_id,
                root_id: obj.root_id
            };
            // Включаем сниппет только если не запрашивается полный текст
            if (!includeText) {
                simplified.snippet = obj.snippet;
            }
            // Process blocks data
            if (obj.blocks && Array.isArray(obj.blocks)) {
                simplified.blocks_count = obj.blocks.length;
                // Extract full text content if requested
                if (includeText) {
                    const fullText = this.extractFullText(obj.blocks);
                    if (fullText) {
                        simplified.full_text = fullText;
                    }
                }
            }
            // Include simplified details (dates and creator)
            if (obj.details && Array.isArray(obj.details)) {
                const dates = {};
                let created_by = null;
                obj.details.forEach((detail) => {
                    if (detail.id === 'created_date' && detail.details?.created_date) {
                        dates.created_date = detail.details.created_date;
                    }
                    if (detail.id === 'last_modified_date' && detail.details?.last_modified_date) {
                        dates.last_modified_date = detail.details.last_modified_date;
                    }
                    if (detail.id === 'last_opened_date' && detail.details?.last_opened_date) {
                        dates.last_opened_date = detail.details.last_opened_date;
                    }
                    if (detail.id === 'tags' && detail.details?.tags) {
                        simplified.tags = detail.details.tags;
                    }
                    // Добавление информации о создателе
                    if (detail.id === 'created_by' && detail.details?.details) {
                        created_by = {
                            name: detail.details.details.name,
                            identity: detail.details.details.identity,
                            role: detail.details.details.role
                        };
                    }
                });
                if (Object.keys(dates).length > 0) {
                    simplified.dates = dates;
                }
                if (created_by) {
                    simplified.created_by = created_by;
                }
            }
            return simplified;
        });
        // Return the filtered data with the same structure
        return {
            data: filteredObjects,
            pagination: data.pagination
        };
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
    // Extract full text from blocks with formatting
    extractFullText(blocks) {
        if (!blocks || !Array.isArray(blocks)) {
            return '';
        }
        // Сопоставление стилей Anytype с текстовыми эквивалентами
        const styleMap = {
            'Header1': { prefix: '# ', suffix: '\n\n' },
            'Header2': { prefix: '## ', suffix: '\n\n' },
            'Header3': { prefix: '### ', suffix: '\n\n' },
            'Header4': { prefix: '#### ', suffix: '\n\n' },
            'Paragraph': { prefix: '', suffix: '\n\n' },
            'Marked': { prefix: '* ', suffix: '\n' }, // Маркированный список
            'Checkbox': { prefix: '- [ ] ', suffix: '\n' }, // Чекбокс по умолчанию не отмечен
            'Quote': { prefix: '> ', suffix: '\n\n' },
            'Code': { prefix: '```\n', suffix: '\n```\n\n' } // Блок кода
        };
        // Формирование отформатированного текста из блоков
        const textParts = [];
        blocks.forEach(block => {
            if (block.text && typeof block.text.text === 'string') {
                const style = block.text.style || 'Paragraph';
                const isChecked = block.text.checked === true;
                // Получение форматирования для данного стиля
                let formatting = styleMap[style] || { prefix: '', suffix: '\n' };
                // Особая обработка для чекбоксов
                if (style === 'Checkbox') {
                    formatting = {
                        prefix: isChecked ? '- [x] ' : '- [ ] ',
                        suffix: '\n'
                    };
                }
                // Добавление форматированного текста
                textParts.push(`${formatting.prefix}${block.text.text}${formatting.suffix}`);
            }
        });
        return textParts.join('');
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
