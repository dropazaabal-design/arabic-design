import { staticFile } from 'remotion';

// Everything the ad says or shows that someone may want to change lives here, apart from the scenes.

export const COLORS = {
  navy: '#071525', // the ground
  blue: '#2E7BC5', // the path, links, structure
  green: '#10B981', // the choice, the step, the call to action
  white: '#F8FAFC', // text
};
/** Tints of the four colours above (the only colours the ad's own graphics use). */
export const TINT = {
  panel: 'rgba(248,250,252,0.06)',
  line: 'rgba(248,250,252,0.16)',
  dim: 'rgba(248,250,252,0.62)',
  blueSoft: 'rgba(46,123,197,0.22)',
  blueMid: 'rgba(46,123,197,0.55)',
  greenSoft: 'rgba(16,185,129,0.18)',
  navyLift: '#0C2138', // navy lifted with a little white, for book spines and panels
  navyLift2: '#12304F',
};

export const TITLE = 'Tajawal, sans-serif';
export const BODY = 'Cairo, sans-serif';

/** Price: off by default. The offer page's launch dates have passed, so no discount, countdown or deadline is shown. */
export const PRICE = { show: false, text: '' }; // e.g. { show: true, text: '99 ريالًا' }

export const LINK = 'kitabwbs.com';
export const HANDLE = '@kitabwbs';

/** The six tracks, in the product's order (track 1 first, read right to left). Pages and counts are from the PDFs. */
export const TRACKS = [
  { n: 1, short: 'المال', name: 'المال والثراء والذكاء المالي', summaries: 10, pages: 47 },
  { n: 2, short: 'العادات', name: 'العادات والإنتاجية والتركيز', summaries: 17, pages: 89 },
  { n: 3, short: 'فهم النفس', name: 'فهم النفس والهدوء والسعادة', summaries: 20, pages: 104 },
  { n: 4, short: 'العلاقات', name: 'التأثير والعلاقات والذكاء الاجتماعي', summaries: 19, pages: 99 },
  { n: 5, short: 'القيادة', name: 'القيادة والإدارة والتفكير', summaries: 20, pages: 104 },
  { n: 6, short: 'الانضباط', name: 'الانضباط والنمو والإلهام', summaries: 13, pages: 70 },
];
export const ORDINAL = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
export const cover = (n: number) => staticFile(`covers/s${n}.png`);
/** Pages of track 2's first summary, «قوة العادات» (PDF pages 5–8): opening, concepts, cases, the three steps. */
export const page = (p: 5 | 6 | 7 | 8) => staticFile(`pages/s2-p${p}.png`);
export const COVER_RATIO = 841.89 / 595.276; // A4
export const PAGE_PX = { w: 1654, h: 2339 }; // the page renders (200 dpi)
/** The picked track and summary (the scenes open this one). */
export const PICK = 1; // index into TRACKS: «العادات»

/** The real step shown in scene 5, quoted from PDF 2, page 8 (step 2 of «قوة العادات»). Kept word for word. */
export const STEP = {
  from: 'من خلاصة «قوة العادات» · المسار الثاني',
  title: 'الخطوة الثانية: اكتب «عقد الاستبدال»',
  body: '«عندما تظهر [الإشارة]، سأفعل [الروتين البديل]، لأحصل على [المكافأة نفسها]»',
};

/** On-screen text, scene by scene (the voice says the same in its own words; the ad reads without sound). */
export const TEXT = {
  s1: ['كم كتابًا اشتريت…', 'وما زال ينتظر؟'],
  later: 'لاحقًا',
  s2: ['ابدأ بفكرة…', 'تعرف كيف تطبّقها'],
  s3: { name: 'بكج افهم نفسك', count: 99, unit: 'خلاصة كتاب', files: '6 ملفات رقمية · 513 صفحة' },
  s4: ['6 مسارات…', 'ابدأ بما يشغلك'],
  s5: { time: 'خلاصة في نحو 15 دقيقة', steps: 'و3 خطوات تطبيقية', flow: ['مفاهيم', 'أمثلة', 'تطبيق'] },
  s6: { open: 'افتحه وقت الحاجة', terms: ['دفعة واحدة', 'بلا اشتراك'], files: 'الملفات', pages: 'صفحة' },
  s7: { line: 'ابدأ بخلاصة واحدة الليلة', name: 'بكج افهم نفسك', cta: 'اكتشف البكج', brand: 'كتاب وبس' },
};
