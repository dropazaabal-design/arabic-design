import { Config } from '@remotion/cli/config';
import { webpackOverride } from './webpack-override.mjs';

// Same render settings as reels/mukarram. The rigs, fonts and effects are imported from reels/mukarram
// (see webpack-override.mjs) instead of being copied.
Config.setPublicDir('./assets');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
if (process.env.REMOTION_CHROME) Config.setBrowserExecutable(process.env.REMOTION_CHROME);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(18);
Config.setConcurrency(4);
Config.overrideWebpackConfig(webpackOverride);
