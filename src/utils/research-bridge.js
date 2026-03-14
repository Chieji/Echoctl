/**
 * Research Bridge
 * Allows the Antigravity agent to use the local BrowserOS MCP server directly.
 */

import axios from 'axios';

const MCP_URL = 'http://127.0.0.1:9001/mcp';

async function callBrowserOS(toolName, args = {}) {
  try {
    // 1. Get SSE endpoint
    const response = await axios.get(MCP_URL, {
      headers: { Accept: 'text/event-stream' },
      timeout: 5000
    });

    // Simple parsing of SSE to find endpoint
    // In a real script we'd use a proper SSE library, but let's keep it simple
    const data = response.data;
    // Note: axios with stream would be better but let's assume we can get the first chunk
    // or just hardcode the likely endpoint if BrowserOS follows standard
    
    // For this bridge, we'll implement a minimal SSE listener
    return new Promise((resolve, reject) => {
      let endpoint = '';
      response.data.on('data', async (chunk) => {
        const content = chunk.toString();
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.startsWith('event: endpoint')) {
             const nextLine = lines[lines.indexOf(line) + 1];
             if (nextLine && nextLine.startsWith('data:')) {
               endpoint = new URL(nextLine.substring(5).trim(), MCP_URL).toString();
               
               // Now call the tool
               try {
                 const callRes = await axios.post(endpoint, {
                   jsonrpc: '2.0',
                   id: Date.now(),
                   method: 'tools/call',
                   params: { name: toolName, arguments: args }
                 });
                 resolve(callRes.data);
               } catch (e) {
                 reject(e);
               }
             }
          }
        }
      });
      
      setTimeout(() => reject(new Error('Timed out waiting for SSE endpoint')), 10000);
    });

  } catch (error) {
    console.error('Bridge Error:', error.message);
    process.exit(1);
  }
}

const [,, tool, argsJson] = process.argv;
if (!tool) {
  console.log('Usage: node research-bridge.js <tool_name> [args_json]');
  process.exit(0);
}

const args = argsJson ? JSON.parse(argsJson) : {};
callBrowserOS(tool, args).then(res => {
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
});
