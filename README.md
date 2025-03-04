# Anytype MCP Server

An MCP (Model Context Protocol) server that provides access to the Anytype API, allowing AI assistants and other MCP clients to interact with your Anytype data.

## Features

- Get list of spaces
- Get objects from spaces
- Get detailed object content
- Create and delete spaces and objects
- Export objects as markdown or protobuf
- Get space members
- Get types and templates

## Prerequisites

- Node.js 18 or higher
- Anytype desktop application running locally
- An Anytype account

## Installation

1. Clone this repository:

   ```cli
   git clone https://github.com/yourusername/anytype-mcp-server.git
   cd anytype-mcp-server
   ```

2. Install dependencies:

   ```node
   npm install
   ```

3. Build the project:

   ```node
   npm run build
   ```

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
      "args": ["path/to/anytype-mcp-server/dist/index.js"],
      "env": {
        "ANYTYPE_APP_KEY": "YOUR_APP_KEY_HERE"
      },
      "disabled": false
    }
  }
}
```

Replace `path/to/anytype-mcp-server` with the actual path to your installation and `YOUR_APP_KEY_HERE` with the app key you obtained.

## Usage

### Starting the server

The MCP server is usually started automatically by the MCP client. However, you can also start it manually for testing:

```node
npm start
```

### Available Tools

The server provides the following tools to MCP clients:

#### 1. Get Spaces

```json
{
  "name": "get_spaces",
  "arguments": {}
}
```

#### 2. Get Objects in a Space

```json
{
  "name": "get_objects",
  "arguments": {
    "space_id": "your-space-id",
    "query": "",
    "offset": 0,
    "limit": 50
  }
}
```

#### 3. Get Object Content

```json
{
  "name": "get_object_content",
  "arguments": {
    "space_id": "your-space-id",
    "object_id": "your-object-id"
  }
}
```

#### 4. Create a New Space

```json
{
  "name": "create_space",
  "arguments": {
    "name": "My New Space"
  }
}
```

#### 5. Create a New Object

```json
{
  "name": "create_object",
  "arguments": {
    "space_id": "your-space-id",
    "name": "My New Object",
    "object_type_unique_key": "ot-page"
  }
}
```

#### 6. Delete an Object

```json
{
  "name": "delete_object",
  "arguments": {
    "space_id": "your-space-id",
    "object_id": "your-object-id"
  }
}
```

#### 7. Export an Object

```json
{
  "name": "export_object",
  "arguments": {
    "space_id": "your-space-id",
    "object_id": "your-object-id",
    "format": "markdown"
  }
}
```

#### 8. Get Space Members

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

#### 9. Get Types

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

#### 10. Get Type Details

```json
{
  "name": "get_type_details",
  "arguments": {
    "space_id": "your-space-id",
    "type_id": "your-type-id"
  }
}
```

#### 11. Get Templates

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

#### 12. Get Template Details

```json
{
  "name": "get_template_details",
  "arguments": {
    "space_id": "your-space-id",
    "type_id": "your-type-id",
    "template_id": "your-template-id"
  }
}
```

## Troubleshooting

### Anytype API Not Responding

Make sure the Anytype desktop application is running on your computer. The MCP server connects to the local Anytype API at `http://localhost:31009/v1`.

### Authentication Issues

If you encounter authentication errors:

1. Run `npm run get-key` to obtain a new app key
2. Update your MCP configuration with the new key
3. Restart your MCP client

### Local API Port

By default, Anytype listens on port 31009. If your installation uses a different port, modify the `apiBaseUrl` in `src/index.ts` accordingly.

## License

MIT
