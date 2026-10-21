// Every word shown on screen besides the burned captions (which are the narration itself).
// tools/copycheck.mjs requires each scene's strings to equal the storyboard's onScreen list.
export const T = {
  sc01: { title: 'حفظت… ولم تطبّق؟' },
  sc02: { reading: 'القراءة', focus: 'التركيز', day: 'ترتيب اليوم' },
  sc03: { title: 'ماذا تغيّر؟', later: 'لاحقًا', reading: 'القراءة', focus: 'التركيز', day: 'ترتيب اليوم' },
  sc04: { title: 'اختر واحدة', small: 'فعل صغير', later: 'لاحقًا', reading: 'القراءة', focus: 'التركيز', day: 'ترتيب اليوم' },
  sc05: { title1: 'اقرأ صفحة', title2: 'مهمة واحدة', focus: 'التركيز' },
  sc06: { title1: 'ليس كل شيء', title2: 'اختر… وابدأ', day: 'ترتيب اليوم' },
  sc07: { day: 'ترتيب اليوم', title: 'ما الخطوة التي ستنفّذها؟', step: 'خطوة واحدة', brand: 'كتاب وبس' },
} as const;
