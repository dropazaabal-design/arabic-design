// One webpack override for the CLI (remotion.config.ts) and the bundle() API (tools/stills.mjs):
// the rigs, fonts and effects come from reels/mukarram (`@mukarram/…`, `@mukarram-assets/…`), and React/
// Remotion always resolve to this reel's node_modules so there is exactly one copy of each.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// remotion.config.ts is bundled as CommonJS (no import.meta there; it runs from this folder).
const here = import.meta?.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd();
export const webpackOverride = (c) => ({
  ...c,
  resolve: {
    ...c.resolve,
    alias: {
      ...(c.resolve?.alias ?? {}),
      '@mukarram': path.resolve(here, '../mukarram/src'),
      '@mukarram-assets': path.resolve(here, '../mukarram/assets'),
      react: path.resolve(here, 'node_modules/react'),
      'react-dom': path.resolve(here, 'node_modules/react-dom'),
      remotion: path.resolve(here, 'node_modules/remotion'),
    },
  },
});
