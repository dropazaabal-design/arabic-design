import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('png');
if (process.env.REMOTION_CHROME) Config.setBrowserExecutable(process.env.REMOTION_CHROME);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
// CRF applies to video only; skipped for audio-only renders (REMOTION_AUDIO_ONLY=1, e.g. --codec=wav).
if (!process.env.REMOTION_AUDIO_ONLY) Config.setCrf(18);
