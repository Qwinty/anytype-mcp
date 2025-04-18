# Anytype MCP Server

[![smithery badge](https://smithery.ai/badge/@Qwinty/anytype-mcp)](https://smithery.ai/server/@Qwinty/anytype-mcp)

An MCP (Model Context Protocol) server that provides access to the Anytype API, allowing AI assistants and other MCP clients to interact with your Anytype data.

**Based on the Anytype API definition v0.46+ (2025-03-17).**
Ensure your Anytype Desktop version is compatible.

## Features

- Get list of spaces (`get_spaces`)
- Search/Get objects within a space (`get_objects`, `search_space`) or globally (`global_search`)
- Get detailed object content (`get_object_content`, supports retrieving full text)
- Create and delete spaces (`create_space`) and objects (`create_object`, `delete_object`)
- Export objects as markdown (`export_object`)
- Manage list views and objects within lists (`get_list_views`, `get_list_view_objects`, `add_objects_to_list`, `remove_object_from_list`)
- Get space members (`get_space_members`)
- Get types and templates (`get_types`, `get_type_details`, `get_templates`, `get_template_details`)

## Prerequisites

- Node.js 18 or higher
- Anytype desktop application running locally
- An Anytype account

## Installation

### Manual Installation

1. Clone this repository:

   ```cli
   git clone https://github.com/Qwinty/anytype-mcp.git
   cd anytype-mcp
   ```

2. Install dependencies:

   ```node
   npm install
   ```

3. Build the project (compiles TypeScript to JavaScript in `build/`):

   ```node
   npm run build
   ```

4. **Obtain an App Key:** Before configuring the server, you need an App Key from Anytype. See the "Getting an App Key" section below.
5. Add the MCP server to your MCP configuration file

## Getting an App Key

Before using the MCP server, you need to obtain an app key from the Anytype desktop application:

1. Make sure Anytype desktop is running
2. Run the helper script:

   ```node
   npm run get-key
   ```

3. Follow the instructions to authorize the application
4. Note the app key for configuration

## Configuration

Add the Anytype MCP server to your MCP configuration file:

- For Claude: Edit `claude_desktop_config.json`
- For other MCP clients: Edit their respective configuration files

Example configuration:

```json
{
  "mcpServers": {
    "anytype": {
      "command": "node",
      "args": ["{path/to/anytype-mcp}/build/index.js"],
      "env": {
        "ANYTYPE_APP_KEY": "YOUR_APP_KEY_HERE"
      },
      "disabled": false
    }
  }
}
```

Replace `path/to/anytype-mcp` with the actual path to your installation and `YOUR_APP_KEY_HERE` with the app key you obtained.

## Usage

### Starting the server

The MCP server is usually started automatically by the MCP client. However, you can also start it manually for testing:

```node
npm start
```

### Available Tools

See [Tools.md](docs/Tools.md) for a detailed list of available tools and their usage examples.

### System Prompt

Additionally, a sample system prompt for AI assistants using this server is available in [docs/system-prompt.md](docs/system-prompt.md).

## Token Efficiency and Data Filtering

To optimize for token usage with AI assistants, this MCP server implements response filtering by default for tools that return object data (`get_objects`, `global_search`, `search_space`).

- **Default Behavior:** The server returns a simplified version of object data, including essential metadata like ID, name, type, icon, layout, space ID, root ID, snippet (if available), block count, tags, creation/modification dates, and creator info. Full block content and detailed relations are omitted.
- **`include_text: true`:** Several tools (`get_objects`, `get_object_content`, `global_search`, `search_space`) support an optional `include_text` parameter. When set to `true`, the server will extract and include the full, formatted text content from the object's blocks in a `full_text` field. Use this when you need the complete text, but be aware it significantly increases response size and token count.
- **`full_response: true`:** The `get_objects`, `global_search`, and `search_space` tools also support a `full_response` parameter. Setting this to `true` bypasses all filtering and returns the raw, complete JSON response directly from the Anytype API. This provides the most detail but uses the most tokens.

Choose the appropriate parameters based on whether you need just metadata, full text content, or the complete raw API response.

## Troubleshooting

### Anytype API Not Responding

Make sure the Anytype desktop application is running on your computer. The MCP server connects to the local Anytype API at `http://localhost:31009/v1`.

### Authentication Issues

If you encounter authentication errors:

1. Run `npm run get-key` to obtain a new app key
2. Update your MCP configuration with the new key
3. Restart your MCP client

### Local API Port

The server connects to the Anytype API at `http://localhost:31009/v1` by default. If your Anytype installation uses a different port, you currently need to modify the `apiBaseUrl` variable in `src/index.ts` and rebuild (`npm run build`). Making this configurable via an environment variable is a potential future improvement.

## License

MIT
