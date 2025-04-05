#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

// Main MCP server class
class AnytypeServer {
  private server: McpServer;
  private apiBaseUrl: string = "http://localhost:31009/v1";
  private appKey: string;

  constructor() {
    // Get app key from environment variable
    this.appKey = process.env.ANYTYPE_APP_KEY || "";
    if (!this.appKey) {
      console.error("Error: ANYTYPE_APP_KEY environment variable is required");
      process.exit(1);
    }

    // Create MCP server
    this.server = new McpServer({
      name: "Anytype API Server",
      version: "1.0.0",
    });

    this.configureTools();
  }

  private configureTools() {
    // Tool 1: Get spaces
    this.server.tool(
      "get_spaces",
      "Retrieves all available Anytype spaces for the current user. This tool returns a list of spaces with their IDs, names, and other metadata. Use this tool to get an overview of all spaces or to find a specific space ID for use with other tools. No parameters are required.",
      {}, // Empty params schema
      async (_) => {
        try {
          const response = await this.makeRequest("get", "/spaces");
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );
    // Tool 2: Get objects in a space
    this.server.tool(
      "get_objects",
      "Searches for and retrieves objects within a specified Anytype space. This tool allows you to list all objects or filter them using a search query. Results are paginated for better performance with large spaces. Use this tool to discover objects within a space, find specific objects by name, or browse through collections of objects. The optional include_text parameter allows retrieving the full formatted text content of objects.",
      {
        space_id: z.string().describe("Space ID to get objects from"),
        offset: z.number().optional().default(0).describe("Pagination offset"),
        limit: z
          .number()
          .optional()
          .default(100)
          .describe("Number of results per page (1-1000)"),
        full_response: z
          .boolean()
          .optional()
          .default(false)
          .describe("Set to true to get full unfiltered response"),
        include_text: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            "Set to true to include full formatted text content from blocks"
          ),
      },
      async ({ space_id, offset, limit, full_response, include_text }) => {
        try {
          // Validate limit
          const validLimit = Math.max(1, Math.min(1000, limit));

          // Use the GET /objects endpoint
          const response = await this.makeRequest(
            "get",
            `/spaces/${space_id}/objects`,
            null, // No request body for GET
            { offset, limit: validLimit } // Pass offset and limit as query params
          );

          // Decide how to process the response data based on parameters
          let responseData;
          if (full_response) {
            // Return unfiltered data if full_response is true
            responseData = response.data;
          } else {
            // Filter the response data to remove unnecessary information
            responseData = this.filterObjectsData(response.data, include_text);
          }

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(responseData, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 3: Get object content
    this.server.tool(
      "get_object_content",
      "Retrieves detailed content and metadata for a specific object in an Anytype space. This tool provides comprehensive information about an object including its properties, relations, and content. Use this tool when you need to examine a specific object's details after discovering its ID through the get_objects tool. The optional include_text parameter allows retrieving the full formatted text content of the object.",
      {
        space_id: z.string().describe("Space ID containing the object"),
        object_id: z.string().describe("Object ID to retrieve"),
        include_text: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            "Set to true to include full formatted text content from blocks"
          ),
      },
      async ({ space_id, object_id, include_text }) => {
        try {
          const response = await this.makeRequest(
            "get",
            `/spaces/${space_id}/objects/${object_id}`
          );

          // Handle new response format with nested 'object' property
          const responseData = response.data.object || response.data;

          // Если запрошен полный текст и есть блоки с содержимым
          if (
            include_text &&
            responseData &&
            responseData.blocks &&
            Array.isArray(responseData.blocks)
          ) {
            const fullText = this.extractFullText(responseData.blocks);
            if (fullText) {
              responseData.full_text = fullText;
            }
          }

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(responseData, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 4: Create a new space
    this.server.tool(
      "create_space",
      "Creates a new Anytype space with the specified name. This tool allows you to set up a fresh workspace for organizing objects and collaborating with others. Use this tool when you need to establish a new organizational container for your Anytype content.",
      {
        name: z.string().describe("Name for the new space"),
      },
      async ({ name }) => {
        try {
          const response = await this.makeRequest("post", "/spaces", { name });
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 5: Create a new object in a space
    this.server.tool(
      "create_object",
      "Creates a new object within a specified Anytype space. This tool allows you to add various types of content (pages, notes, tasks, etc.) to your spaces. You can specify the object's name, type, description, icon, and content. Optionally, you can use a template to create pre-structured objects. Use this tool when you need to add new content to an existing space.",
      {
        space_id: z.string().describe("Space ID to create the object in"),
        name: z.string().describe("Object name"),
        type_key: z
          .string()
          .describe("Type key of object to create (e.g. 'ot-page')"),
        description: z.string().optional().describe("Object description"),
        icon: z
          .object({
            format: z
              .enum(["emoji", "file", "icon"])
              .describe("Icon format (required if icon is provided)"),
            emoji: z
              .string()
              .optional()
              .describe("Emoji character (if format is 'emoji')"),
            file: z
              .string()
              .url()
              .optional()
              .describe("URL to the icon file (if format is 'file')"),
            name: z
              .string()
              .optional()
              .describe("Name of the built-in icon (if format is 'icon')"),
            color: z
              .string()
              .optional()
              .describe("Color of the icon (optional)"),
          })
          .optional()
          .describe("Object icon details (structure based on API docs)"),
        body: z
          .string()
          .optional()
          .describe("Object body/content (Markdown supported)"),
        template_id: z.string().optional().describe("Template ID to use"),
        source: z.string().optional().describe("Source URL (for bookmarks)"),
      },
      async ({
        space_id,
        name,
        type_key,
        description,
        icon,
        body,
        template_id,
        source,
      }) => {
        try {
          const createObj: any = {
            name,
            type_key,
          };

          if (description) createObj.description = description;
          if (icon) createObj.icon = icon;
          if (body) createObj.body = body;
          if (template_id) createObj.template_id = template_id;
          if (source) createObj.source = source;

          const response = await this.makeRequest(
            "post",
            `/spaces/${space_id}/objects`,
            createObj
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 6: Delete an object
    this.server.tool(
      "delete_object",
      "Permanently removes an object from a specified Anytype space. This tool deletes the object and all its content. Use this tool with caution as deleted objects cannot be recovered. Always verify the object ID before deletion to avoid removing important content.",
      {
        space_id: z.string().describe("Space ID containing the object"),
        object_id: z.string().describe("Object ID to delete"),
      },
      async ({ space_id, object_id }) => {
        try {
          const response = await this.makeRequest(
            "delete",
            `/spaces/${space_id}/objects/${object_id}`
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 7: Export an object as markdown
    this.server.tool(
      "export_object",
      "Exports an Anytype object in Markdown format. This tool allows you to extract content from Anytype for use in other applications or for backup purposes. Markdown format is human-readable and suitable for documentation. Use this tool when you need to share Anytype content with external systems or create portable backups.",
      {
        space_id: z.string().describe("Space ID containing the object"),
        object_id: z.string().describe("Object ID to export"),
        format: z
          .literal("markdown")
          .describe("Export format (currently only 'markdown' is supported)"),
      },
      async ({ space_id, object_id, format }) => {
        try {
          const response = await this.makeRequest(
            "get",
            `/spaces/${space_id}/objects/${object_id}/${format}`
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 8: Get space members
    this.server.tool(
      "get_space_members",
      "Retrieves a list of all members who have access to a specified Anytype space. This tool provides information about each member including their ID, name, and access level. Results are paginated for spaces with many members. Use this tool when you need to understand who has access to a space or manage collaboration permissions.",
      {
        space_id: z.string().describe("Space ID to get members from"),
        offset: z.number().optional().default(0).describe("Pagination offset"),
        limit: z
          .number()
          .optional()
          .default(100)
          .describe("Number of results per page (1-1000)"),
      },
      async ({ space_id, offset, limit }) => {
        try {
          // Validate limit
          const validLimit = Math.max(1, Math.min(1000, limit));

          const response = await this.makeRequest(
            "get",
            `/spaces/${space_id}/members`,
            null,
            { offset, limit: validLimit }
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 9: Get types in a space
    this.server.tool(
      "get_types",
      "Retrieves all object types available in a specified Anytype space. This tool provides information about the different types of objects that can be created in the space, including their IDs, names, and metadata. Results are paginated for spaces with many types. Use this tool when you need to understand what types of objects can be created or to find the correct type ID for creating new objects.",
      {
        space_id: z.string().describe("Space ID to get types from"),
        offset: z.number().optional().default(0).describe("Pagination offset"),
        limit: z
          .number()
          .optional()
          .default(100)
          .describe("Number of results per page (1-100)"),
      },
      async ({ space_id, offset, limit }) => {
        try {
          // Validate limit
          const validLimit = Math.max(1, Math.min(1000, limit));

          const response = await this.makeRequest(
            "get",
            `/spaces/${space_id}/types`,
            null,
            { offset, limit: validLimit }
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 10: Get type details
    this.server.tool(
      "get_type_details",
      "Retrieves detailed information about a specific object type in an Anytype space. This tool provides comprehensive details about the type's structure, including its relations, views, and configuration options. Use this tool when you need to understand the structure of a particular object type or to examine its available relations and properties.",
      {
        space_id: z.string().describe("Space ID containing the type"),
        type_id: z.string().describe("Type ID to retrieve details for"),
      },
      async ({ space_id, type_id }) => {
        try {
          const response = await this.makeRequest(
            "get",
            `/spaces/${space_id}/types/${type_id}`
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 11: Get templates for a type
    this.server.tool(
      "get_templates",
      "Retrieves all available templates for a specific object type in an Anytype space. Templates provide pre-configured structures and content for creating new objects. This tool returns a list of templates with their IDs, names, and metadata. Results are paginated for types with many templates. Use this tool when you need to find appropriate templates for creating new objects of a specific type.",
      {
        space_id: z.string().describe("Space ID containing the type"),
        type_id: z.string().describe("Type ID to get templates for"),
        offset: z.number().optional().default(0).describe("Pagination offset"),
        limit: z
          .number()
          .optional()
          .default(100)
          .describe("Number of results per page (1-1000)"),
      },
      async ({ space_id, type_id, offset, limit }) => {
        try {
          // Validate limit
          const validLimit = Math.max(1, Math.min(1000, limit));

          const response = await this.makeRequest(
            "get",
            `/spaces/${space_id}/types/${type_id}/templates`,
            null,
            { offset, limit: validLimit }
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 12: Get template details
    this.server.tool(
      "get_template_details",
      "Retrieves detailed information about a specific template in an Anytype space. This tool provides comprehensive details about the template's structure, content, and configuration. Use this tool when you need to examine a template's properties before using it to create new objects, or to understand how a particular template is structured.",
      {
        space_id: z.string().describe("Space ID containing the template"),
        type_id: z.string().describe("Type ID for the template"),
        template_id: z.string().describe("Template ID to retrieve details for"),
      },
      async ({ space_id, type_id, template_id }) => {
        try {
          const response = await this.makeRequest(
            "get",
            `/spaces/${space_id}/types/${type_id}/templates/${template_id}`
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 13: Get list views
    this.server.tool(
      "get_list_views",
      "Retrieves views configured for a specific list in a space. Views define how objects in the list are filtered and sorted.",
      {
        space_id: z.string().describe("Space ID containing the list"),
        list_id: z.string().describe("List ID to get views for"),
        offset: z.number().optional().default(0).describe("Pagination offset"),
        limit: z
          .number()
          .optional()
          .default(100)
          .describe("Number of results per page (1-1000)"),
      },
      async ({ space_id, list_id, offset, limit }) => {
        try {
          const validLimit = Math.max(1, Math.min(1000, limit));
          const response = await this.makeRequest(
            "get",
            `/spaces/${space_id}/lists/${list_id}/views`,
            null,
            { offset, limit: validLimit }
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 14: Get objects in list view
    this.server.tool(
      "get_list_view_objects",
      "Retrieves objects from a specific list view with applied filters and sorting.",
      {
        space_id: z.string().describe("Space ID containing the list"),
        list_id: z.string().describe("List ID"),
        view_id: z.string().describe("View ID"),
        offset: z.number().optional().default(0).describe("Pagination offset"),
        limit: z
          .number()
          .optional()
          .default(100)
          .describe("Number of results per page (1-1000)"),
      },
      async ({ space_id, list_id, view_id, offset, limit }) => {
        try {
          const validLimit = Math.max(1, Math.min(1000, limit));
          const response = await this.makeRequest(
            "get",
            `/spaces/${space_id}/lists/${list_id}/${view_id}/objects`,
            null,
            { offset, limit: validLimit }
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 15: Add objects to list
    this.server.tool(
      "add_objects_to_list",
      "Adds one or more objects to a specific list in a space.",
      {
        space_id: z.string().describe("Space ID containing the list"),
        list_id: z.string().describe("List ID to add objects to"),
        object_ids: z.array(z.string()).describe("Array of object IDs to add"),
      },
      async ({ space_id, list_id, object_ids }) => {
        try {
          const response = await this.makeRequest(
            "post",
            `/spaces/${space_id}/lists/${list_id}/objects`,
            object_ids
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 16: Remove object from list
    this.server.tool(
      "remove_object_from_list",
      "Removes an object from a specific list in a space.",
      {
        space_id: z.string().describe("Space ID containing the list"),
        list_id: z.string().describe("List ID to remove object from"),
        object_id: z.string().describe("Object ID to remove"),
      },
      async ({ space_id, list_id, object_id }) => {
        try {
          const response = await this.makeRequest(
            "delete",
            `/spaces/${space_id}/lists/${list_id}/objects/${object_id}`
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 17: Global Search
    this.server.tool(
      "global_search",
      "Executes a search across all spaces the user has access to, with options for filtering by type and sorting.",
      {
        query: z.string().describe("Search term"),
        types: z
          .array(z.string())
          .optional()
          .describe("Optional list of object type keys or IDs to filter by"),
        sort_property: z
          .enum([
            "created_date",
            "last_modified_date",
            "last_opened_date",
            "name",
          ])
          .optional()
          .default("last_modified_date")
          .describe("Property to sort by"),
        sort_direction: z
          .enum(["asc", "desc"])
          .optional()
          .default("desc")
          .describe("Sort direction"),
        offset: z.number().optional().default(0).describe("Pagination offset"),
        limit: z
          .number()
          .optional()
          .default(100)
          .describe("Number of results per page (1-1000)"),
        include_text: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            "Set to true to include full formatted text content from blocks. USE WITH CAUTION: This can return a large amount of data."
          ),
      },
      async ({
        query,
        types,
        sort_property,
        sort_direction,
        offset,
        limit,
        include_text,
      }) => {
        try {
          const validLimit = Math.max(1, Math.min(1000, limit));
          const searchRequest: any = { query };
          if (types) {
            searchRequest.types = types;
          }
          searchRequest.sort = {
            property: sort_property,
            direction: sort_direction,
          };

          const response = await this.makeRequest(
            "post",
            `/search`,
            searchRequest,
            { offset, limit: validLimit }
          );
          // Pass include_text to filterObjectsData
          const responseData = this.filterObjectsData(
            response.data,
            include_text
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(responseData, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );

    // Tool 18: Search objects within a specific space
    this.server.tool(
      "search_space",
      "Executes a search within a specific space, with options for filtering by type and sorting.",
      {
        space_id: z.string().describe("Space ID to search within"),
        query: z.string().optional().describe("Search term"),
        types: z
          .array(z.string())
          .optional()
          .describe("Optional list of object type keys or IDs to filter by"),
        sort_property: z
          .enum([
            "created_date",
            "last_modified_date",
            "last_opened_date",
            "name",
          ])
          .optional()
          .default("last_modified_date")
          .describe("Property to sort by"),
        sort_direction: z
          .enum(["asc", "desc"])
          .optional()
          .default("desc")
          .describe("Sort direction"),
        offset: z.number().optional().default(0).describe("Pagination offset"),
        limit: z
          .number()
          .optional()
          .default(100)
          .describe("Number of results per page (1-1000)"),
        full_response: z
          .boolean()
          .optional()
          .default(false)
          .describe("Set to true to get full unfiltered response"),
        include_text: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            "Set to true to include full formatted text content from blocks. USE WITH CAUTION: This can return a large amount of data."
          ),
      },
      async ({
        space_id,
        query,
        types,
        sort_property,
        sort_direction,
        offset,
        limit,
        full_response,
        include_text,
      }) => {
        try {
          const validLimit = Math.max(1, Math.min(1000, limit));
          const searchRequest: any = { query };
          if (types) {
            searchRequest.types = types;
          }
          searchRequest.sort = {
            property: sort_property,
            direction: sort_direction,
          };

          const response = await this.makeRequest(
            "post",
            `/spaces/${space_id}/search`,
            searchRequest,
            { offset, limit: validLimit }
          );

          // Decide how to process the response data based on parameters
          let responseData;
          if (full_response) {
            // Return unfiltered data if full_response is true
            responseData = response.data;
          } else {
            // Filter the response data
            responseData = this.filterObjectsData(response.data, include_text);
          }

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(responseData, null, 2),
              },
            ],
          };
        } catch (error) {
          return this.handleApiError(error);
        }
      }
    );
  }

  // Filter objects data to remove unnecessary information
  private filterObjectsData(data: any, includeText: boolean = false): any {
    if (!data || !data.data || !Array.isArray(data.data)) {
      return data;
    }

    const filteredObjects = data.data.map((obj: any) => {
      // Create a simplified object with only essential information
      const simplified: any = {
        id: obj.id,
        type: obj.type,
        name: obj.name,
        icon: obj.icon,
        layout: obj.layout,
        space_id: obj.space_id,
        root_id: obj.root_id,
      };

      // Include snippet only if not requested full text
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
        const dates: any = {};
        let created_by: any = null;

        obj.details.forEach((detail: any) => {
          if (detail.id === "created_date" && detail.details?.created_date) {
            dates.created_date = detail.details.created_date;
          }
          if (
            detail.id === "last_modified_date" &&
            detail.details?.last_modified_date
          ) {
            dates.last_modified_date = detail.details.last_modified_date;
          }
          if (
            detail.id === "last_opened_date" &&
            detail.details?.last_opened_date
          ) {
            dates.last_opened_date = detail.details.last_opened_date;
          }
          if (detail.id === "tags" && detail.details?.tags) {
            simplified.tags = detail.details.tags;
          }
          // Добавление информации о создателе
          if (detail.id === "created_by" && detail.details?.details) {
            created_by = {
              name: detail.details.details.name,
              identity: detail.details.details.identity,
              role: detail.details.details.role,
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
      pagination: data.pagination,
    };
  }

  // Helper method to make authenticated API requests
  private async makeRequest(
    method: "get" | "post" | "delete",
    endpoint: string,
    data?: any,
    params?: any
  ) {
    try {
      const config = {
        method,
        url: `${this.apiBaseUrl}${endpoint}`,
        headers: {
          Authorization: `Bearer ${this.appKey}`,
          "Content-Type": "application/json",
        },
        data,
        params,
      };

      return await axios(config);
    } catch (error) {
      console.error(`API request error: ${error}`);
      throw error;
    }
  }

  // Extract full text from blocks with formatting
  private extractFullText(blocks: any[]): string {
    if (!blocks || !Array.isArray(blocks)) {
      return "";
    }

    // Сопоставление стилей Anytype с текстовыми эквивалентами
    const styleMap: Record<string, { prefix: string; suffix: string }> = {
      Header1: { prefix: "# ", suffix: "\n\n" },
      Header2: { prefix: "## ", suffix: "\n\n" },
      Header3: { prefix: "### ", suffix: "\n\n" },
      Header4: { prefix: "#### ", suffix: "\n\n" },
      Paragraph: { prefix: "", suffix: "\n\n" },
      Marked: { prefix: "* ", suffix: "\n" }, // Маркированный список
      Checkbox: { prefix: "- [ ] ", suffix: "\n" }, // Чекбокс по умолчанию не отмечен
      Quote: { prefix: "> ", suffix: "\n\n" },
      Code: { prefix: "```\n", suffix: "\n```\n\n" }, // Блок кода
    };

    // Формирование отформатированного текста из блоков
    const textParts: string[] = [];

    blocks.forEach((block) => {
      if (block.text && typeof block.text.text === "string") {
        const style = block.text.style || "Paragraph";
        const isChecked = block.text.checked === true;

        // Получение форматирования для данного стиля
        let formatting = styleMap[style] || { prefix: "", suffix: "\n" };

        // Особая обработка для чекбоксов
        if (style === "Checkbox") {
          formatting = {
            prefix: isChecked ? "- [x] " : "- [ ] ",
            suffix: "\n",
          };
        }

        // Добавление форматированного текста
        textParts.push(
          `${formatting.prefix}${block.text.text}${formatting.suffix}`
        );
      }
    });

    return textParts.join("");
  }

  // Helper to handle API errors in a consistent way
  private handleApiError(error: any) {
    let errorMessage = "Unknown API error";

    // Handle network errors first
    if (error.code === "ECONNREFUSED") {
      errorMessage = "Anytype is not running. Launch it and try again.";
      return this.printError(errorMessage);
    }

    // Handle API response errors
    const status = error.response?.status;
    const apiError = error.response?.data?.error;

    switch (status) {
      case 400:
        errorMessage = apiError?.message || "Bad request";
        if (apiError?.code === "validation_error") {
          errorMessage +=
            ". Invalid parameters: " +
            (apiError.details
              ?.map((d: { field: string }) => d.field)
              .join(", ") || "unknown fields");
        }
        break;
      case 401:
        errorMessage = "Unauthorized - Check your App Key";
        break;
      case 403:
        errorMessage =
          "Forbidden - You don't have permission for this operation";
        break;
      case 404:
        errorMessage = "Not found - The requested resource doesn't exist";
        break;
      case 429:
        errorMessage = "Rate limit exceeded - Try again later";
        break;
      case 500:
        errorMessage = "Internal server error - Contact Anytype support";
        break;
      default:
        if (status >= 500 && status < 600) {
          errorMessage = `Server error (${status}) - Try again later`;
        } else if (apiError?.message) {
          errorMessage = apiError.message;
        }
        break;
    }
    return this.printError(errorMessage);
  }

  private printError(errorMessage: any) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }

  // Start the server
  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Anytype MCP server started on stdio");
  }
}

// Create and start the server
const server = new AnytypeServer();
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
