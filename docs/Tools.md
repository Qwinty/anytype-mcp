# Available Tools

The server provides the following tools to MCP clients:

## 1. Get Spaces

```json
{
  "name": "get_spaces",
  "arguments": {}
}
```

## 2. Get Objects in a Space

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

## 3. Get Object Content

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

## 4. Create a New Space

```json
{
  "name": "create_space",
  "arguments": {
    "name": "My New Space"
  }
}
```

## 5. Create a New Object

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

## 6. Delete an Object

```json
{
  "name": "delete_object",
  "arguments": {
    "space_id": "your-space-id",
    "object_id": "your-object-id"
  }
}
```

## 7. Export an Object (Markdown only)

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

## 8. Get Space Members

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

## 9. Get Types

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

## 10. Get Type Details

```json
{
  "name": "get_type_details",
  "arguments": {
    "space_id": "your-space-id",
    "type_id": "your-type-id"
  }
}
```

## 11. Get Templates

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

## 12. Get Template Details

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

## 13. Get List Views

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

## 14. Get Objects in List View

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

## 15. Add Objects to List

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

## 16. Remove Object from List

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

## 17. Global Search

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

## 18. Search within a Space

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
