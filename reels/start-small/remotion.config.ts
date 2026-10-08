import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('png');
if (process.env.REMOTION_CHROME) Config.setBrowserExecutable(process.env.REMOTION_CHROME);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(18);
