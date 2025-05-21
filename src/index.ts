#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { EventSource } from "eventsource";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListToolsResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ReadResourceResultSchema,
  CompatibilityCallToolResultSchema,
  GetPromptResultSchema
} from "@modelcontextprotocol/sdk/types.js";
import { createClient, ConnectedClient } from "./client.js";

// Polyfill EventSource for an SSE client in Node.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).EventSource = EventSource;

let connectedClient: ConnectedClient | null = null;

const server = new Server(
  {
    name: "resource-hub-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: { subscribe: false },
      tools: {},
      prompts: {},
    },
  }
);

// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  if (!connectedClient) throw new Error("No client connected");
  
  try {
    const result = await connectedClient.client.request(
      {
        method: 'tools/list',
        params: {
          _meta: request.params?._meta
        }
      },
      ListToolsResultSchema
    );
    
    return {
      tools: result.tools?.map(tool => ({
        ...tool,
        description: `${tool.description || ''}`
      })) || []
    };
  } catch (error) {
    console.error('Error fetching tools:', error);
    throw error;
  }
});

// Call Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!connectedClient) throw new Error("No client connected");
  const { name, arguments: args } = request.params;

  try {
    // console.log('Forwarding tool call:', name);
    return await connectedClient.client.request(
      {
        method: 'tools/call',
        params: {
          name,
          arguments: args || {},
          _meta: {
            progressToken: request.params._meta?.progressToken
          }
        }
      },
      CompatibilityCallToolResultSchema
    );
  } catch (error) {
    console.error('Error calling tool:', error);
    throw error;
  }
});

// List Prompts Handler
server.setRequestHandler(ListPromptsRequestSchema, async (request) => {
  if (!connectedClient) throw new Error("No client connected");

  try {
    const result = await connectedClient.client.request(
      {
        method: 'prompts/list',
        params: {
          cursor: request.params?.cursor,
          _meta: request.params?._meta || {
            progressToken: undefined
          }
        }
      },
      ListPromptsResultSchema
    );

    return {
      prompts: result.prompts?.map(prompt => ({
        ...prompt,
        description: `${prompt.description || ''}`
      })) || [],
      nextCursor: request.params?.cursor
    };
  } catch (error) {
    console.error('Error fetching prompts:', error);
    throw error;
  }
});

// Get Prompt Handler
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (!connectedClient) throw new Error("No client connected");
  const { name } = request.params;

  try {
    // console.log('Forwarding prompt request:', name);
    const response = await connectedClient.client.request(
      {
        method: 'prompts/get',
        params: {
          name,
          arguments: request.params.arguments || {},
          _meta: request.params._meta || {
            progressToken: undefined
          }
        }
      },
      GetPromptResultSchema
    );

    console.log('Prompt result:', response);
    return response;
  } catch (error) {
    console.error('Error getting prompt:', error);
    throw error;
  }
});

// List Resources Handler
server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
  if (!connectedClient) throw new Error("No client connected");

  try {
    const result = await connectedClient.client.request(
      {
        method: 'resources/list',
        params: {
          cursor: request.params?.cursor,
          _meta: request.params?._meta
        }
      },
      ListResourcesResultSchema
    );

    return {
      resources: result.resources?.map(resource => ({
        ...resource,
        name: `${resource.name || ''}`
      })) || [],
      nextCursor: undefined
    };
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
});

// Read Resource Handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (!connectedClient) throw new Error("No client connected");
  const { uri } = request.params;

  try {
    return await connectedClient.client.request(
      {
        method: 'resources/read',
        params: {
          uri,
          _meta: request.params._meta
        }
      },
      ReadResourceResultSchema
    );
  } catch (error) {
    console.error('Error reading resource:', error);
    throw error;
  }
});

async function authenticate(token: string) {
  try {
    const serverUrl = process.env.RESOURCE_HUB_URL || 'http://localhost:3006';
    const response = await fetch(`${serverUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    const rawText = await response.text();
    const data = JSON.parse(rawText);
    return data.token;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}

async function main() {
  try {
    const initialToken = process.env.RESOURCE_HUB_TOKEN;
    if (!initialToken) {
      throw new Error("RESOURCE_HUB_TOKEN environment variable is required");
    }
    const authToken = await authenticate(initialToken);
    
    const serverUrl = process.env.RESOURCE_HUB_URL || 'http://localhost:3006';
    connectedClient = await createClient(authToken, serverUrl);
  } catch (error) {
    console.error("Failed to create client:", error);
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
