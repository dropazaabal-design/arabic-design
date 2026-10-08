// Every word shown on screen, in one place. tools/copycheck.mjs requires this to
// equal the storyboard's onScreen lists exactly (same strings, same scenes).
export const T = {
  sc01: { price40: '40 دولارًا', price200: '200 دولار', feelsHigh: 'يبدو غاليًا', feelsLow: 'يبدو أخفّ', samePrice: 'السعر نفسه', hypothetical: 'مثال افتراضي' },
  sc02: { what: 'ما الذي تغيّر؟', beside: 'بجانبها', yes: 'نعم', why: 'لماذا وافقتُ؟' },
  sc03: { title: 'التأثير', subtitle: 'علم نفس الإقناع', author: 'روبرت سيالديني', shortcut: 'اختصار ذهني', principle: 'مبدأ التباين' },
  sc04: { ruler: 'مسطرة ثابتة؟', cold: 'بارد', warm: 'فاتر', hot: 'ساخن', sameWater: 'الماء واحد', first: 'ما تراه أولًا', reference: 'نقطة المقارنة', after: 'ما بعده يُقاس عليها' },
  sc05: { price40: '40 دولارًا', price200: '200 دولار', reference: 'نقطة المقارنة', plan: 'الخطة: 30 دولارًا', saved: 'وفّرتُ 160 دولارًا؟', over: '10 دولارات فوق الخطة', warning: 'أخفّ… لا يعني مناسبًا', hypothetical: 'مثال افتراضي' },
  sc06: { laptop: '900 دولار', case60: '60 دولارًا', alone: 'وحدها؟', notNaive: 'ليست سذاجة', notTrick: 'ولا كل عرض خدعة', hypothetical: 'مثال افتراضي' },
  sc07: { need: 'الحاجة', yardstick: 'معيار مستقل', decision: 'القرار', hours: 'كم ساعة في الشهر؟', unseen: 'لو لم أرَ الأغلى؟', week1: 'قبل أي شراء فوق 20 دولارًا', week2: 'اكتب حاجتك وميزانيتك' },
  sc08: { equal: '40 دولارًا = 40 دولارًا', q1: 'هل وافقتُ لأنه يناسبني…', q2: 'أم لأن طريقة عرضه جعلته يبدو كذلك؟', series: 'فكرة من كتاب', brand: 'كتاب وبس' },
} as const;
