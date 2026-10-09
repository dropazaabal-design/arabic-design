// Every word shown on screen besides the burned captions (which are the speaker's own words).
// Titles are his phrases, cut short; labels name what the drawing shows. tools/copycheck.mjs requires
// each scene's strings to equal the storyboard's onScreen list.
export const T = {
  sc01: { q: 'من أذكى الناس؟', a: 'الفطن المتغافل' },
  sc02: { title: 'التغافل', title2: 'تكلّف الغفلة', shown: 'تظهر كذلك', real: 'ولست كذلك' },
  sc03: { title: 'صفة محمودة' },
  sc04: { title: 'الفطن المتغافل', sharp: 'فطِن', overlook: 'متغافل' },
  sc05: { q: 'أنت لماذا قلت؟', poet: 'لذا قال الأول' },
  sc06: { l1: 'ليس الغبيُّ بسيدٍ في قومه', l2: 'لكنّ سيدَ قومِه المتغابي', dull: 'الغبي', wise: 'المتغابي' },
  sc07: { l1: 'وتغافلْ عن أمورٍ إنه', l2: 'لم يفُزْ بالحمدِ إلا من غفل', praise: 'الحمد' },
  sc08: { title1: 'حمد من عاشره', title2: 'من خصال السادة' },
  sc09: { title1: 'هذا التغافل', title2: 'حتى في بيتك', kids: 'بنيك', family: 'أهلك', yours: 'من إليك' },
  sc10: { title1: 'لقد رأيت… لكن', title2: 'اصنع كأنك لم تسمع' },
  sc11: { title: 'الفطن المتغافل', brand: 'كتاب وبس', source: 'مقطع منشور على X' },
} as const;
