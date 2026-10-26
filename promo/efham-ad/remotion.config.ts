import path from 'node:path';
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
if (process.env.REMOTION_CHROME) Config.setBrowserExecutable(process.env.REMOTION_CHROME);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setColorSpace('bt709');
// Shared modules (fonts) come from films/hudoo; they resolve react from this project.
Config.overrideWebpackConfig((c) => ({
  ...c,
  resolve: { ...c.resolve, modules: [path.resolve(process.cwd(), 'node_modules'), 'node_modules'] },
}));
