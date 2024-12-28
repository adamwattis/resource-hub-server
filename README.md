# resource-hub-server

An MCP server that connects to the Resource Hub - a central place to configure and manage your MCP servers.

## Overview

The resource-hub-server acts as a proxy between your local MCP environment and the Resource Hub. It allows you to:

- Access centrally configured tools and resources
- Share configurations across different environments
- Manage MCP server settings in one place

## Usage

### Quick Start with npx

The easiest way to run the server is using npx:

```bash
RESOURCE_HUB_TOKEN=your_token npx @adamwattis/resource-hub-server
```

### Running from Source

If you want to run from source:

1. Install dependencies:
```bash
npm install
```

2. Build the server:
```bash
npm run build
```

3. Run with your Resource Hub token:
```bash
RESOURCE_HUB_TOKEN=your_token npm start
```

### Configuration

You'll need a Resource Hub token to use this server. You can get this from the Resource Hub token page.

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "resource-hub-server": {
      "command": "npx @adamwattis/resource-hub-server"
    }
  }
}
```

### Environment Variables

- `RESOURCE_HUB_TOKEN` (required): Your Resource Hub authentication token

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
