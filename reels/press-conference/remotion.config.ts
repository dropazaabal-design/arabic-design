import { Config } from '@remotion/cli/config';
import { webpackOverride } from './webpack-override.mjs';

// Same render settings as the other reels; 60 fps comes from timeline.json. Rigs/fonts from reels/mukarram, the
// motion layer from reels/motion (webpack-override.mjs).
Config.setPublicDir('./assets');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
if (process.env.REMOTION_CHROME) Config.setBrowserExecutable(process.env.REMOTION_CHROME);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
if (!process.env.AUDIO_ONLY) Config.setCrf(18);   // AUDIO_ONLY=1 renders the mix alone (--codec=wav) to set the mix gain before the picture
Config.setConcurrency(4);
Config.overrideWebpackConfig(webpackOverride);
