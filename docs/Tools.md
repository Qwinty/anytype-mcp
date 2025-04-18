# Available Tools

The server provides the following tools to MCP clients:

## 1. `get_spaces`

Retrieves all available Anytype spaces for the current user. This tool returns a list of spaces with their IDs, names, and other metadata. Use this tool to get an overview of all spaces or to find a specific space ID for use with other tools. No parameters are required.

```json
{
  "name": "get_spaces",
  "arguments": {}
}
```

## 2. `get_objects`

Searches for and retrieves objects within a specified Anytype space. This tool allows you to list all objects or filter them using a search query. Results are paginated for better performance with large spaces. Use this tool to discover objects within a space, find specific objects by name, or browse through collections of objects. The optional `include_text` parameter allows retrieving the full formatted text content of objects.

```json
{
  "name": "get_objects",
  "arguments": {
    "space_id": "your-space-id",
    "offset": 0, // Optional
    "limit": 100, // Optional (1-1000, default 100)
    "full_response": false, // Optional: Get full unfiltered API response
    "include_text": false // Optional: Include full text content from blocks
  }
}
```

## 3. `get_object_content`

Retrieves detailed content and metadata for a specific object in an Anytype space. This tool provides comprehensive information about an object including its properties, relations, and content. Use this tool when you need to examine a specific object's details after discovering its ID through the `get_objects` tool. The optional `include_text` parameter allows retrieving the full formatted text content of the object.

```json
{
  "name": "get_object_content",
  "arguments": {
    "space_id": "your-space-id",
    "object_id": "your-object-id",
    "include_text": false // Optional: Include full text content from blocks
  }
}
```

## 4. `create_space`

Creates a new Anytype space with the specified name. This tool allows you to set up a fresh workspace for organizing objects and collaborating with others. Use this tool when you need to establish a new organizational container for your Anytype content.

```json
{
  "name": "create_space",
  "arguments": {
    "name": "My New Space"
  }
}
```

## 5. `create_object`

Creates a new object within a specified Anytype space. This tool allows you to add various types of content (pages, notes, tasks, etc.) to your spaces. You can specify the object's name, type, description, icon, and content. Optionally, you can use a template to create pre-structured objects. Use this tool when you need to add new content to an existing space.

```json
{
  "name": "create_object",
  "arguments": {
    "space_id": "your-space-id",
    "name": "My New Page",
    "type_key": "ot-page", // e.g., 'ot-page', 'ot-task'
    "description": "Optional description", // Optional
    "icon": { // Optional
      "format": "emoji", // "emoji", "file", or "icon"
      "emoji": "📄" // if format is "emoji"
      // "file": "https://url.to/icon.png", // if format is "file"
      // "name": "icon-name", // if format is "icon"
      // "color": "#FF0000" // Optional color
    },
    "body": "## Hello World\n\nThis is the content.", // Optional: Markdown content
    "template_id": "your-template-id", // Optional
    "source": "https://example.com" // Optional: for bookmarks
  }
}
```

## 6. `delete_object`

Archives (marks as deleted) an object from a specified Anytype space. This tool archives the object and all its content. Use this tool with caution as archived objects might not be easily recoverable through the API. Always verify the object ID before deletion to avoid archiving important content.

```json
{
  "name": "delete_object",
  "arguments": {
    "space_id": "your-space-id",
    "object_id": "your-object-id"
  }
}
```

## 7. `export_object`

Exports an Anytype object in Markdown format. This tool allows you to extract content from Anytype for use in other applications or for backup purposes. Markdown format is human-readable and suitable for documentation. Use this tool when you need to share Anytype content with external systems or create portable backups.

```json
{
  "name": "export_object",
  "arguments": {
    "space_id": "your-space-id",
    "object_id": "your-object-id",
    "format": "markdown" // Only markdown is supported
  }
}
```

## 8. `get_space_members`

Retrieves a list of all members who have access to a specified Anytype space. This tool provides information about each member including their ID, name, and access level. Results are paginated for spaces with many members. Use this tool when you need to understand who has access to a space or manage collaboration permissions.

```json
{
  "name": "get_space_members",
  "arguments": {
    "space_id": "your-space-id",
    "offset": 0,
    "limit": 100
  }
}
```

## 9. `get_types`

Retrieves all object types available in a specified Anytype space. This tool provides information about the different types of objects that can be created in the space, including their IDs, names, and metadata. Results are paginated for spaces with many types. Use this tool when you need to understand what types of objects can be created or to find the correct type ID for creating new objects.

```json
{
  "name": "get_types",
  "arguments": {
    "space_id": "your-space-id",
    "offset": 0,
    "limit": 100
  }
}
```

## 10. `get_type_details`

Retrieves detailed information about a specific object type in an Anytype space. This tool provides comprehensive details about the type's structure, including its relations, views, and configuration options. Use this tool when you need to understand the structure of a particular object type or to examine its available relations and properties.

```json
{
  "name": "get_type_details",
  "arguments": {
    "space_id": "your-space-id",
    "type_id": "your-type-id"
  }
}
```

## 11. `get_templates`

Retrieves all available templates for a specific object type in an Anytype space. Templates provide pre-configured structures and content for creating new objects. This tool returns a list of templates with their IDs, names, and metadata. Results are paginated for types with many templates. Use this tool when you need to find appropriate templates for creating new objects of a specific type.

```json
{
  "name": "get_templates",
  "arguments": {
    "space_id": "your-space-id",
    "type_id": "your-type-id",
    "offset": 0,
    "limit": 100
  }
}
```

## 12. `get_template_details`

Retrieves detailed information about a specific template in an Anytype space. This tool provides comprehensive details about the template's structure, content, and configuration. Use this tool when you need to examine a template's properties before using it to create new objects, or to understand how a particular template is structured.

```json
{
  "name": "get_template_details",
  "arguments": {
    "space_id": "your-space-id",
    "type_id": "your-type-id",
    "template_id": "your-template-id"
  }
}
}
}
```

## 13. `get_list_views`

Retrieves views configured for a specific list (Set or Collection) in a space. Views define how objects in the list are filtered and sorted.

```json
{
"name": "get_list_views",
"arguments": {
  "space_id": "your-space-id",
  "list_id": "your-list-object-id",
  "offset": 0,
  "limit": 100
}
}
```

## 14. `get_list_view_objects`

Retrieves objects from a specific list view, applying the view's configured filters and sorting.

```json
{
"name": "get_list_view_objects",
"arguments": {
  "space_id": "your-space-id",
  "list_id": "your-list-object-id",
  "view_id": "your-view-id",
  "offset": 0,
  "limit": 100
}
}
```

## 15. `add_objects_to_list`

Adds one or more objects to a specific list (Collection only) in a space.

```json
{
"name": "add_objects_to_list",
"arguments": {
  "space_id": "your-space-id",
  "list_id": "your-list-object-id",
  "object_ids": ["object-id-1", "object-id-2"]
}
}
```

## 16. `remove_object_from_list`

Removes an object from a specific list (Collection only) in a space.

```json
{
"name": "remove_object_from_list",
"arguments": {
  "space_id": "your-space-id",
  "list_id": "your-list-object-id",
  "object_id": "object-id-to-remove"
}
}
```

## 17. `global_search`

Executes a search across all spaces the user has access to, with options for filtering by type and sorting. Searches match against object `name` and `snippet`.

```json
{
"name": "global_search",
"arguments": {
  "query": "search term",
  "types": ["ot-page", "ot-task"], // Optional
  "sort_property": "last_modified_date", // Optional
  "sort_direction": "desc", // Optional
  "offset": 0,
  "limit": 100,
  "include_text": false // Optional: Include full text content. Use with caution.
}
}
```

## 18. `search_space`

Executes a search within a specific space, with options for filtering by type and sorting. Searches match against object `name` and `snippet`.

```json
{
  "name": "search_space",
  "arguments": {
    "space_id": "your-space-id",
    "query": "search term", // Optional
    "types": ["ot-page", "ot-task"], // Optional
    "sort_property": "last_modified_date", // Optional
    "sort_direction": "desc", // Optional
    "offset": 0,
    "limit": 100,
    "full_response": false, // Optional: Get full unfiltered API response
    "include_text": false // Optional: Include full text content. Use with caution.
  }
}
