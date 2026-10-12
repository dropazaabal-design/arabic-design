import {Config} from '@remotion/cli/config';
import {resolve} from 'node:path';
// Reuse a tracked Arabic voice and font assets from an existing published reel.
// No copies or mutations of the source reel.
Config.setPublicDir(resolve(process.cwd(),'../reels/clear-thinking-pause/public'));
