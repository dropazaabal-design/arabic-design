import React from 'react';
import { BODY } from '../../fonts';
import { INK, PAL } from '../style';
import { Avatar, StatusBar, UI, clamp01, type Theme } from './ui';

export type ChatMessage = { from: 'me' | 'them'; text: string; time?: string };
export type ChatScreenProps = {
  name: string; messages: ChatMessage[];
  /** 0..1: the "typing…" bubble fades in (and the header says يكتب…). */
  typing?: number;
  /** what I am typing (pass a growing substring to animate typing). */
  draft?: string; draftCaret?: boolean;
  /** 0..1 deletes the draft from its end. */
  erase?: number;
  /** screen theme: 'day' light, 'night' dark. */
  header?: Theme;
  /** seconds, drives the typing dots. */
  t?: number;
};

const Ticks = ({ color }: { color: string }) => (
  <svg width={18} height={11} viewBox="0 0 18 11" style={{ flex: 'none' }}>
    <path d="M1 6 L4.5 9.5 L11 1.5 M7 8.5 L8 9.5 L14.5 1.5" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Icon = ({ d, color, size = 26 }: { d: string; color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: 'none' }}><path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const BACK = 'M9 5 L16 12 L9 19'; // points right: "back" in an RTL app
const CALL = 'M5 4 h4 l2 5 l-2.5 1.5 a11 11 0 0 0 5 5 l1.5 -2.5 l5 2 v4 a2 2 0 0 1 -2 2 A16 16 0 0 1 3 6 a2 2 0 0 1 2 -2';
const VIDEO = 'M3 7 h12 v10 h-12 Z M15 11 l6 -3.5 v9 l-6 -3.5';

/**
 * A chat app screen, authored at 360×720 (top-left origin), right-to-left: the other person's bubbles sit on the
 * RIGHT, mine on the LEFT (as in Arabic-language messaging apps). Newest messages at the bottom; older ones
 * scroll off the top when the draft grows.
 */
export const ChatScreen = ({ name, messages, typing = 0, draft, draftCaret = false, erase = 0, header = 'day', t = 0 }: ChatScreenProps) => {
  const c = UI[header];
  const chars = Array.from(draft ?? '');
  const shown = chars.slice(0, Math.round(chars.length * (1 - clamp01(erase)))).join('');
  const clock = [...messages].reverse().find((m) => m.time)?.time ?? '11:40';
  const ty = clamp01(typing);
  const edge = header === 'day' ? `2px solid ${INK}` : `2px solid ${c.edge}`;
  return (
    <g>
      <rect width={360} height={720} fill={c.bg} />
      {/* faint wallpaper doodles */}
      <g fill="none" stroke={c.text} strokeWidth={2} opacity={0.05}>
        {Array.from({ length: 14 }, (_, k) => {
          const x = 30 + ((k * 97) % 320), y = 130 + ((k * 151) % 520);
          return k % 2 ? <circle key={k} cx={x} cy={y} r={9} /> : <path key={k} d={`M${x - 10} ${y} q5 -8 10 0 t10 0`} />;
        })}
      </g>
      <foreignObject width={360} height={720}>
        <div dir="rtl" lang="ar" style={{ width: 360, height: 720, display: 'flex', flexDirection: 'column', fontFamily: BODY, fontWeight: 600, color: c.text }}>
          <div style={{ background: c.bar, borderBottom: `1.5px solid ${c.line}` }}>
            <StatusBar time={clock} color={c.text} />
            <div style={{ height: 62, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 4px 14px' }}>
              <Icon d={BACK} color={c.text} />
              <Avatar name={name} size={42} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                <span style={{ fontSize: 21, fontWeight: 700 }}>{name}</span>
                <span style={{ fontSize: 13.5, color: ty > 0.5 ? c.accent : c.soft }}>{ty > 0.5 ? 'يكتب…' : 'متصل الآن'}</span>
              </div>
              <div style={{ flex: 1 }} />
              <Icon d={CALL} color={c.text} size={24} />
              <Icon d={VIDEO} color={c.text} />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6, padding: '10px 12px 6px' }}>
            {messages.map((m, k) => {
              const mine = m.from === 'me';
              const first = k === 0 || messages[k - 1].from !== m.from;
              return (
                <div key={k} style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', marginTop: first && k ? 6 : 0,
                  background: mine ? c.mine : c.theirs, border: edge, boxSizing: 'border-box',
                  borderRadius: 18, [mine ? 'borderTopLeftRadius' : 'borderTopRightRadius']: first ? 4 : 18,
                  padding: '7px 13px 4px', display: 'flex', flexDirection: 'column',
                }}>
                  <span style={{ fontSize: 20, lineHeight: 1.55 }}>{m.text}</span>
                  {m.time && (
                    <span style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: c.soft, lineHeight: 1.4 }}>
                      <span dir="ltr">{m.time}</span>{mine && <Ticks color={c.tick} />}
                    </span>
                  )}
                </div>
              );
            })}
            {ty > 0 && (
              <div style={{ alignSelf: 'flex-start', opacity: ty, transform: `scale(${0.7 + 0.3 * ty})`, transformOrigin: 'right bottom', background: c.theirs, border: edge, borderRadius: 18, borderTopRightRadius: 4, padding: '12px 16px', display: 'flex', gap: 6, marginTop: 6 }}>
                {[0, 1, 2].map((d) => {
                  const up = Math.max(0, Math.sin((t * 1.6 - d * 0.18) * Math.PI * 2));
                  return <span key={d} style={{ width: 10, height: 10, borderRadius: 5, background: c.soft, transform: `translateY(${-5 * up}px)`, opacity: 0.55 + 0.45 * up }} />;
                })}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '6px 10px 16px' }}>
            <div style={{ flex: 1, minHeight: 48, maxHeight: 6 * 31 + 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: c.field, border: edge, borderRadius: 24, boxSizing: 'border-box', padding: '7px 16px' }}>
              <div style={{ fontSize: 20, lineHeight: 1.55, color: shown ? c.text : c.soft }}>
                {shown || (draftCaret ? '' : 'اكتب رسالة')}
                {draftCaret && <span style={{ display: 'inline-block', width: 2.5, height: '1.2em', background: PAL.focus, verticalAlign: '-0.25em', marginInlineStart: 1 }} />}
              </div>
            </div>
            <div style={{ width: 48, height: 48, flex: 'none', borderRadius: 24, background: c.accent, border: edge, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {shown
                ? <Icon d="M4 12 L20 4 L17 12 L20 20 Z M17 12 H11" color="#FFFFFF" />
                : <Icon d="M12 3 a3 3 0 0 1 3 3 v6 a3 3 0 0 1 -6 0 v-6 a3 3 0 0 1 3 -3 M6 11 a6 6 0 0 0 12 0 M12 17 v4" color="#FFFFFF" />}
            </div>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};
