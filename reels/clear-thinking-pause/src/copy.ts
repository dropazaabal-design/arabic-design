// Every string drawn on screen, in one place (checked by tools/copycheck.mjs against storyboard.json).
// The conversation is our own example: no real names or messages.
export const COPY = {
  hook: ['لا ترسلها', 'وأنت غاضب'] as const, // one sentence, shown big on two lines, then on one
  handle: '@kitabwbs',
  incoming: 'أسلوبك غير مناسب',
  draft: ['أنت', 'آخر', 'من', 'يحق', 'له', 'الكلام'],
  calm: ['أختلف', 'معك،', 'لكن', 'دعنا', 'نتكلم', 'بهدوء'],
  example: 'مثال',
  sc2: 'بقيت ضغطة واحدة',
  sc3: ['يخدمك…', 'أم', 'يفرّغ غضبك؟'] as const,
  sc4: { label: 'فكرة من', title: '«التفكير الواضح»', author: 'شين باريش' },
  sc5: 'اتركها في المسودات',
  sc6: 'قلها دون إهانة',
  sc7: ['سأردّ', 'عندما', 'أهدأ'],
};
