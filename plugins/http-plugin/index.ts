/**
 * HTTP/REST Plugin for Echoctl
 * Enables generic HTTP requests to any API
 */

import { Plugin } from '../../src/services/PluginManager';

export const httpPlugin: Plugin = {
  name: 'http',
  version: '1.0.0',
  description: 'Generic HTTP/REST client for Echoctl - make requests to any API',
  author: 'Manus AI',

  async initialize() {
    console.log('🌐 Initializing HTTP plugin...');
  },

  async destroy() {
    console.log('🌐 Destroying HTTP plugin...');
  },

  tools: {
    /**
     * Make a generic HTTP request
     */
    request: {
      name: 'http:request',
      description: 'Make a generic HTTP request to any API',
      args: {
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'], default: 'GET' },
        url: { type: 'string', description: 'Full URL to request' },
        headers: { type: 'object', description: 'HTTP headers' },
        body: { type: 'object', description: 'Request body (for POST/PUT/PATCH)' },
        timeout: { type: 'number', default: 30000 },
        followRedirects: { type: 'boolean', default: true },
      },
      async execute(args: any) {
        try {
          const { method, url, headers, body, timeout, followRedirects } = args;

          // Validate URL
          try {
            new URL(url);
          } catch {
            throw new Error('Invalid URL format');
          }

          const fetchOptions: any = {
            method,
            headers: headers || {},
            timeout,
            redirect: followRedirects ? 'follow' : 'manual',
          };

          if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
            fetchOptions.headers['Content-Type'] = 'application/json';
          }

          const response = await fetch(url, fetchOptions);

          const contentType = response.headers.get('content-type');
          let data: any;

          if (contentType?.includes('application/json')) {
            data = await response.json();
          } else if (contentType?.includes('text')) {
            data = await response.text();
          } else {
            data = await response.arrayBuffer();
          }

          return {
            success: response.ok,
            statusCode: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers),
            data,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },

    /**
     * GET request
     */
    get: {
      name: 'http:get',
      description: 'Make a GET request',
      args: {
        url: { type: 'string', description: 'URL to request' },
        headers: { type: 'object', description: 'HTTP headers' },
        timeout: { type: 'number', default: 30000 },
      },
      async execute(args: any) {
        const { url, headers, timeout } = args;
        return this.tools.request.execute({
          method: 'GET',
          url,
          headers,
          timeout,
        });
      },
    },

    /**
     * POST request
     */
    post: {
      name: 'http:post',
      description: 'Make a POST request',
      args: {
        url: { type: 'string', description: 'URL to request' },
        body: { type: 'object', description: 'Request body' },
        headers: { type: 'object', description: 'HTTP headers' },
        timeout: { type: 'number', default: 30000 },
      },
      async execute(args: any) {
        const { url, body, headers, timeout } = args;
        return this.tools.request.execute({
          method: 'POST',
          url,
          body,
          headers,
          timeout,
        });
      },
    },

    /**
     * PUT request
     */
    put: {
      name: 'http:put',
      description: 'Make a PUT request',
      args: {
        url: { type: 'string', description: 'URL to request' },
        body: { type: 'object', description: 'Request body' },
        headers: { type: 'object', description: 'HTTP headers' },
        timeout: { type: 'number', default: 30000 },
      },
      async execute(args: any) {
        const { url, body, headers, timeout } = args;
        return this.tools.request.execute({
          method: 'PUT',
          url,
          body,
          headers,
          timeout,
        });
      },
    },

    /**
     * DELETE request
     */
    delete: {
      name: 'http:delete',
      description: 'Make a DELETE request',
      args: {
        url: { type: 'string', description: 'URL to request' },
        headers: { type: 'object', description: 'HTTP headers' },
        timeout: { type: 'number', default: 30000 },
      },
      async execute(args: any) {
        const { url, headers, timeout } = args;
        return this.tools.request.execute({
          method: 'DELETE',
          url,
          headers,
          timeout,
        });
      },
    },

    /**
     * Download file from URL
     */
    download: {
      name: 'http:download',
      description: 'Download a file from a URL',
      args: {
        url: { type: 'string', description: 'URL to download from' },
        destination: { type: 'string', description: 'Local file path to save to' },
        headers: { type: 'object', description: 'HTTP headers' },
      },
      async execute(args: any) {
        try {
          const { url, destination, headers } = args;
          const fs = require('fs');
          const path = require('path');

          // Validate destination path
          const resolvedPath = path.resolve(destination);
          const allowedBase = path.resolve(process.env.HOME || '/tmp');

          if (!resolvedPath.startsWith(allowedBase)) {
            throw new Error('Download destination outside allowed directory');
          }

          const response = await fetch(url, {
            headers: headers || {},
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const buffer = await response.arrayBuffer();
          fs.writeFileSync(destination, Buffer.from(buffer));

          return {
            success: true,
            destination,
            size: buffer.byteLength,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },

    /**
     * Upload file to URL
     */
    upload: {
      name: 'http:upload',
      description: 'Upload a file to a URL',
      args: {
        url: { type: 'string', description: 'URL to upload to' },
        filePath: { type: 'string', description: 'Local file path' },
        fieldName: { type: 'string', description: 'Form field name', default: 'file' },
        headers: { type: 'object', description: 'HTTP headers' },
      },
      async execute(args: any) {
        try {
          const { url, filePath, fieldName, headers } = args;
          const fs = require('fs');
          const path = require('path');

          // Validate file path
          const resolvedPath = path.resolve(filePath);
          const allowedBase = path.resolve(process.env.HOME || '/tmp');

          if (!resolvedPath.startsWith(allowedBase)) {
            throw new Error('File path outside allowed directory');
          }

          if (!fs.existsSync(filePath)) {
            throw new Error('File not found');
          }

          const fileBuffer = fs.readFileSync(filePath);
          const fileName = path.basename(filePath);

          // Create FormData
          const FormData = require('form-data');
          const form = new FormData();
          form.append(fieldName, fileBuffer, fileName);

          const response = await fetch(url, {
            method: 'POST',
            body: form,
            headers: {
              ...headers,
              ...form.getHeaders(),
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          return {
            success: true,
            statusCode: response.status,
            data,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },
  },

  hooks: {
    'tool:executed': [
      async (toolName: string, result: any) => {
        if (toolName.startsWith('http:')) {
          console.log(`✓ HTTP tool executed: ${toolName}`);
        }
      },
    ],
  },
};

export default httpPlugin;
