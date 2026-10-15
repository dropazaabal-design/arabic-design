// One webpack override for the CLI (remotion.config.ts) and the bundle() API (tools/*.mjs), as in
// reels/blind-obedience: the rig, faces and fonts come from reels/mukarram (`@mukarram/…`, `@mukarram-assets/…`), the
// arm IK from reels/doublethink (`@doublethink/…`), the motion layer from reels/motion (`@motion/…`, which resolves
// gsap, @remotion/gsap, @remotion/paths and the Rive runtime from its own node_modules). React and Remotion always
// resolve to this reel's node_modules (one copy each, also for the packages under reels/motion).
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = import.meta?.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd();
export const webpackOverride = (c) => ({
  ...c,
  resolve: {
    ...c.resolve,
    alias: {
      ...(c.resolve?.alias ?? {}),
      '@mukarram': path.resolve(here, '../mukarram/src'),
      '@mukarram-assets': path.resolve(here, '../mukarram/assets'),
      '@doublethink': path.resolve(here, '../doublethink/src'),
      '@motion': path.resolve(here, '../motion/src'),
      react: path.resolve(here, 'node_modules/react'),
      'react-dom': path.resolve(here, 'node_modules/react-dom'),
      remotion: path.resolve(here, 'node_modules/remotion'),
    },
  },
});
