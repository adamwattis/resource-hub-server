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
    const transport = new SSEClientTransport(new URL("http://localhost:3006/sse"));

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
    console.log("Client created");
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
