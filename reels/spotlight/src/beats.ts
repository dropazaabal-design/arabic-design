import { TL, sceneStart, sec, segEnd, wordAt } from './time';

// Every beat in frames, from seconds on the recording (words.json) and the
// timeline's real fps (60). Nothing here counts frames by hand.
export const F = {
  s2: sceneStart(2), s3: sceneStart(3), s4: sceneStart(4), s5: sceneStart(5), s6: sceneStart(6), s7: sceneStart(7), s8: sceneStart(8),
  end: TL.durationInFrames,
};

export const B = {
  // 1 — the light sweeps onto an empty chair; a small slip in a bubble; its shadow keeps growing
  hookEnd: sec(3) + sec(0.27), bubble: wordAt('s1', 'قلت'), squiggle: wordAt('s1', 'غلط'), swell: wordAt('s1', 'ورجعت'),
  ghostChairs: wordAt('s2', 'مين'), ghosts: wordAt('s2', 'وتتخيل'),
  // 2 — the bubble replays in a loop over a notebook; the beam flares; the name
  notebook: F.s2 + sec(0.15), loop: wordAt('s3', 'وقتها') - sec(0.2), flare: wordAt('s3', 'كشاف'), details: wordAt('s3', 'وكل'),
  ghostsOut: wordAt('s4', 'هذا'), name: wordAt('s4', 'تأثير') - sec(0.25),
  // 3 — inside the light, then the camera pulls back on a busy room
  pull: wordAt('s5', 'بكل'), estimate: wordAt('s5', 'بعيون') - sec(0.2), estimateEnd: F.s4 + sec(0.45),
  // 4 — the shirt, the source, the two cards
  source: wordAt('s6', 'بحث'), picture: wordAt('s6', 'صورة'), guess: wordAt('s6', 'وقدّروا'),
  cardA: wordAt('s7', 'تقديرهم') - sec(0.1), higher: wordAt('s7', 'أعلى'), cardB: wordAt('s7', 'عدد') - sec(0.1),
  // 5 — a discussion; one word huge up close, ordinary from afar
  talk: F.s5 + sec(0.7), bigWord: wordAt('s8', 'بالغوا'), wide: wordAt('s9', 'أكيد'), glance: wordAt('s9', 'ممكن'), feeling: wordAt('s9', 'إحساسك'),
  // 6 — noticed / assumed; the same slip on another chair, in ordinary light
  noticed: wordAt('s10', 'إيش'), noticedScrap: wordAt('s10', 'لاحظته'), assumed: wordAt('s10', 'وإيش'), assumedScrap: wordAt('s10', 'افترضته'),
  chairB: wordAt('s11', 'شخص'), slipB: wordAt('s11', 'قال') - sec(0.2), clock: wordAt('s11', 'كنت'),
  // 7 — apology, correction, the talk goes on, attention turns to the other
  apology: wordAt('s12', 'اعتذر') - sec(0.35), correct: wordAt('s12', 'صحّحها') - sec(0.1), reply: wordAt('s12', 'وكمّل'),
  swing: wordAt('s13', 'ورجّع'), goal: wordAt('s13', 'وإيش'),
  // 8 — the replay urge, then the light calms and widens
  replay: wordAt('s14', 'تعيد'), calm: wordAt('s14', 'تذكّر'), widen: wordAt('s14', 'كبير'), smaller: wordAt('s14', 'أصغر'),
  closing: segEnd('s14') + sec(0.2), sign: TL.durationInFrames - sec(2.6),
};
