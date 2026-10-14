import { useGsapTimeline } from '@remotion/gsap';
import React from 'react';
import { CamKey, camera } from './moves';
import { drawn } from './paths';

/** World under a GSAP-driven camera (inside an <svg> of size width×height). React never sets the two groups'
 *  transforms; the paused timeline does, sought to the current frame by @remotion/gsap. */
export const GsapCamera: React.FC<{ width: number; height: number; start: Omit<CamKey, 'at' | 'dur' | 'ease'>; moves: CamKey[]; children: React.ReactNode }> = ({ width, height, start, moves, children }) => {
  const scope = useGsapTimeline<SVGGElement>(({ timeline, selector }) => {
    camera(timeline, selector('[data-cam=zoom]'), selector('[data-cam=pan]'), start, moves);
  }, { dependencies: [JSON.stringify(start), JSON.stringify(moves)] });
  return (
    <g ref={scope}>
      <g transform={`translate(${width / 2} ${height / 2})`}>
        <g data-cam="zoom">
          <g data-cam="pan">{children}</g>
        </g>
      </g>
    </g>
  );
};

/** A path drawn to progress p (0..1) with @remotion/paths; `from` erases the start (a travelling trail). */
export const DrawPath: React.FC<{ d: string; p: number; from?: number } & React.SVGProps<SVGPathElement>> = ({ d, p, from = 0, ...rest }) => {
  if (p <= 0) return null;
  const { strokeDasharray, strokeDashoffset } = drawn(d, p, from);
  return <path d={d} fill="none" strokeLinecap="round" strokeLinejoin="round" {...rest} strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />;
};
