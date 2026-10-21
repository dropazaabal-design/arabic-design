import React from 'react';
import { BODY } from '../../fonts';
import { INK, PAL } from '../style';
import { Avatar, StatusBar, UI, clamp01 } from './ui';

export type PostComment = { name: string; text: string; hostile?: boolean };
export type PostScreenProps = {
  author: string; text: string; comments: PostComment[];
  /** the author's calm reply, threaded under the hostile comment. */
  reply?: string;
  /** 0..1 opens the ⋯ menu on the hostile comment («حظر» / «إبلاغ»). */
  menu?: number;
  /** 0..1 the hostile comment fades to «تم الحظر». */
  blocked?: number;
  time?: string;
};

const ico = (d: string, color: string, size = 22) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: 'none' }}><path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const HEART = 'M12 20 C4 14 3 10 4.5 7 A4.5 4.5 0 0 1 12 6.5 A4.5 4.5 0 0 1 19.5 7 C21 10 20 14 12 20 Z';
const BUBBLE = 'M4 5 h16 v11 h-9 l-4 4 v-4 h-3 Z';
const SHARE = 'M20 12 L12 5 v4 C6 9 4 13 4 19 C6 15 9 14 12 14 v4 Z';
const BLOCK = 'M12 3 a9 9 0 1 0 0.01 0 Z M5.6 5.6 L18.4 18.4';
const FLAG = 'M5 21 V4 M5 4 h11 l-2 4 l2 4 h-11';

/**
 * A social post with its comments, authored at 360×720 (top-left origin), right-to-left. The hostile comment carries
 * the ⋯ menu; `menu` opens it, `blocked` swaps the comment for «تم الحظر». Day theme.
 */
export const PostScreen = ({ author, text, comments, reply, menu = 0, blocked = 0, time = '11:40' }: PostScreenProps) => {
  const c = UI.day;
  const m = clamp01(menu), b = clamp01(blocked);
  const card: React.CSSProperties = { background: '#FFFFFF', border: `2px solid ${INK}`, borderRadius: 16, boxSizing: 'border-box' };
  return (
    <g>
      <rect width={360} height={720} fill={c.bg} />
      <foreignObject width={360} height={720}>
        <div dir="rtl" lang="ar" style={{ width: 360, height: 720, display: 'flex', flexDirection: 'column', fontFamily: BODY, fontWeight: 600, color: c.text }}>
          <div style={{ background: c.bar, borderBottom: `1.5px solid ${c.line}` }}>
            <StatusBar time={time} color={c.text} />
            <div style={{ height: 50, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
              {ico('M9 5 L16 12 L9 19', c.text, 26)}
              <span style={{ fontSize: 21, fontWeight: 700 }}>منشور</span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10, padding: 10 }}>
            <div style={{ ...card, padding: '12px 14px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={author} size={44} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                  <span style={{ fontSize: 19, fontWeight: 700 }}>{author}</span>
                  <span style={{ fontSize: 13, color: c.soft }}>قبل ساعتين</span>
                </div>
              </div>
              <div style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.6, margin: '10px 2px 8px' }}>{text}</div>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center', borderTop: `1.5px solid ${c.line}`, paddingTop: 6, fontSize: 15, color: c.soft }}>
                <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>{ico(HEART, PAL.warn)}<span>128</span></span>
                <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>{ico(BUBBLE, c.soft)}<span>{comments.length + (reply ? 1 : 0)}</span></span>
                <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>{ico(SHARE, c.soft)}</span>
              </div>
            </div>
            <span style={{ fontSize: 15, color: c.soft, padding: '0 6px' }}>التعليقات</span>
            {comments.map((k, i) => (
              <React.Fragment key={i}>
                <div style={{ position: 'relative', zIndex: k.hostile ? 2 : 1, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flex: 1, opacity: k.hostile ? 1 - b : 1 }}>
                    <Avatar name={k.name} size={36} />
                    <div style={{ ...card, flex: 1, padding: '6px 12px 8px', borderRadius: 14, borderTopRightRadius: 4, background: k.hostile && m > 0 ? PAL.provokeLight : '#FFFFFF' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: c.soft, lineHeight: 1.5 }}>{k.name}</div>
                      <div style={{ fontSize: 19, lineHeight: 1.5 }}>{k.text}</div>
                    </div>
                    <div style={{ width: 30, height: 30, flex: 'none', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', background: k.hostile && m > 0 ? c.line : 'transparent', fontSize: 22, color: c.soft, lineHeight: 1 }}>
                      <svg width={20} height={6} viewBox="0 0 20 6">{[3, 10, 17].map((x) => <circle key={x} cx={x} cy={3} r={2.4} fill={c.soft} />)}</svg>
                    </div>
                  </div>
                  {k.hostile && b > 0 && (
                    <div style={{ position: 'absolute', inset: 0, opacity: b, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, border: `2px dashed ${c.soft}`, background: c.bg, color: c.soft, fontSize: 19, fontWeight: 700 }}>
                      {ico(BLOCK, c.soft)}<span>تم الحظر</span>
                    </div>
                  )}
                  {k.hostile && m > 0 && (
                    <div style={{ position: 'absolute', left: 6, top: 34, opacity: m, transform: `scale(${0.6 + 0.4 * m})`, transformOrigin: 'left top', ...card, borderRadius: 14, width: 150, padding: '4px 0', display: 'flex', flexDirection: 'column' }}>
                      {[['حظر', BLOCK, PAL.provoke], ['إبلاغ', FLAG, c.text]].map(([label, d, col], j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', fontSize: 20, fontWeight: 700, color: col, borderTop: j ? `1.5px solid ${c.line}` : 'none' }}>
                          {ico(d, col)}<span>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {k.hostile && reply && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginRight: 44 }}>
                    <Avatar name={author} size={30} />
                    <div style={{ ...card, flex: 1, padding: '6px 12px 8px', borderRadius: 14, borderTopRightRadius: 4, background: c.mine }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: PAL.calm, lineHeight: 1.5 }}>{author}</div>
                      <div style={{ fontSize: 19, lineHeight: 1.5 }}>{reply}</div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px 16px', borderTop: `1.5px solid ${c.line}`, background: c.bar }}>
            <Avatar name={author} size={34} />
            <div style={{ flex: 1, height: 42, borderRadius: 21, border: `2px solid ${INK}`, boxSizing: 'border-box', background: '#FFFFFF', display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 17, color: c.soft }}>اكتب تعليقًا…</div>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};
