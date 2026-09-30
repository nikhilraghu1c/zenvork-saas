import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiUrl = process.env.API_URL?.replace(/\/+$/, '');

if (apiUrl === undefined || (apiUrl && !apiUrl.startsWith('https://'))) {
  throw new Error('API_URL must be empty for same-origin hosting or an HTTPS URL.');
}

const outputPath = resolve('dist/zenvork-ui/browser/runtime-config.js');
const contents = `window.__ZENVORK_RUNTIME_CONFIG__ = { apiUrl: ${JSON.stringify(apiUrl)} };\n`;

await writeFile(outputPath, contents, 'utf8');
