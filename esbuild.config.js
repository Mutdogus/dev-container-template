import { build } from 'esbuild';
import { glob } from 'glob';
import path from 'path';

const entryFiles = await glob('src/**/*.ts', { ignore: ['src/**/*.test.ts'] });

build({
  entryPoints: ['src/server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/server.js',
  external: [
    '@modelcontextprotocol/sdk',
    '@octokit/rest',
    '@octokit/plugin-throttling',
    '@octokit/plugin-retry',
  ],
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  define: {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`,
  },
  logLevel: 'info',
}).catch(() => process.exit(1));