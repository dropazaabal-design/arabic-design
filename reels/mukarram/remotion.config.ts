import { Config } from '@remotion/cli/config';

// Same render settings as the other reels; the public folder is assets/ (fonts, sfx, voice).
Config.setPublicDir('./assets');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
if (process.env.REMOTION_CHROME) Config.setBrowserExecutable(process.env.REMOTION_CHROME);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(18);
Config.setConcurrency(4);
