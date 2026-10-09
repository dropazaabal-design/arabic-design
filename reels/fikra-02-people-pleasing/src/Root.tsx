import React from 'react';
import { Composition } from 'remotion';
import { Episode, SceneOnly } from './Episode';
import { CoverTall, Thumbnail } from './Cover';
import timeline from '../timeline.json';

// 1920×1080 at 60 fps from the first frame; duration from the (measured or provisional) timeline.
export const Root: React.FC = () => (
  <>
    <Composition id="Episode" component={Episode} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={timeline.width} height={timeline.height} />
    {timeline.scenes.map((s) => (
      <Composition key={s.sceneId} id={`Scene-${s.sceneId}`} component={SceneOnly} defaultProps={{ sceneId: s.sceneId }}
        durationInFrames={Math.round((s.end - s.start) * timeline.fps)} fps={timeline.fps} width={timeline.width} height={timeline.height} />
    ))}
    <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={timeline.fps} width={1920} height={1080} />
    <Composition id="CoverTall" component={CoverTall} durationInFrames={1} fps={timeline.fps} width={1080} height={1920} />
  </>
);
