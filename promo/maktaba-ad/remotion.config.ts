import path from 'node:path';
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
if (process.env.REMOTION_CHROME) Config.setBrowserExecutable(process.env.REMOTION_CHROME);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setColorSpace('bt709');
// The character rig comes from films/hudoo/src/kit; it resolves react from this project.
Config.overrideWebpackConfig((c) => ({
  ...c,
  resolve: { ...c.resolve, modules: [path.resolve(process.cwd(), 'node_modules'), 'node_modules'] },
}));
