import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export interface ConnectedClient {
  client: Client;
  cleanup: () => Promise<void>;
  name: string;
}

export const createClient = async (): Promise<ConnectedClient> => {
    console.log("Creating client");
  try {
    const token = process.env.RESOURCE_HUB_TOKEN;
    if (!token) {
      throw new Error("RESOURCE_HUB_TOKEN environment variable is required");
    }
    const url = new URL("http://localhost:3006/sse");
    url.searchParams.set('token', token);
    const transport = new SSEClientTransport(url);

    const client = new Client({
      name: 'resource-hub-client',
      version: '1.0.0',
    }, {
      capabilities: {
        prompts: {},
        resources: { subscribe: true },
        tools: {}
      }
    });
    await client.connect(transport);
    console.log("Client connected");

    return {
      client,
      name: 'resource-hub-client',
      cleanup: async () => {
        await transport.close();
      }
    };
  } catch (error) {
    console.error(`Failed to connect to server:`, error);
    throw error; // Rethrow the error to handle it outside this function
  }
};
