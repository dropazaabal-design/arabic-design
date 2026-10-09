// Every word shown on screen (besides the burned captions, which are the narration itself).
// tools/copycheck.mjs requires this to equal the storyboard's onScreen lists exactly.
export const T = {
  sc01: { title: ['دقيقتان', 'بلا', 'هاتف؟'] },
  sc02: { title: 'حتى بلا إشعار' },
  sc03: { title: 'لاحظ العادة' },
  sc04: { title: 'حجب الإنترنت أسبوعين', source: 'المصدر: كاستيلو وزملاؤه، 2025' },
  sc05: { title: 'تجربة، وليست وعدًا', weeks: 'أسبوعان', minutes: 'دقيقتان' },
  sc06: { title: 'لسبب… أم عادة؟', reason: 'لسبب', habit: 'عادة', brand: 'كتاب وبس' },
} as const;
