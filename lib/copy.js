'use strict';

/**
 * copy.js — the words around the design: hooks, captions, and what gives a
 * generated Arabic post away.
 *
 * The structural ideas here — pick the hook by the goal, spend slide one on a
 * promise, put the strongest point early, end on one ask — come from Serge
 * Bulaev's instagram-skills (MIT). Its rules are English and Instagram; nothing
 * of its text or code is reused. What this file adds is the part that did not
 * exist: the Arabic tells, and Facebook's own rules.
 *
 * Two kinds of finding, kept apart on purpose:
 *   - tells:  phrases that mark copy as machine-written. A reader who spots one
 *             discounts everything around it.
 *   - bait:   asking for a reaction instead of earning one. Facebook demotes
 *             posts for it — comment-baiting, share-baiting, tag-baiting and
 *             react-baiting are named in its own engagement-bait policy — so
 *             this is reach, not style.
 */

const { stripBidiControls } = require('./bidi');

// ---------------------------------------------------------------------------
// Arabic generator tells
// ---------------------------------------------------------------------------

/**
 * Each of these is an English cliché rendered word for word, or an essay reflex
 * that no one uses in a post. Precision over recall: every entry is a phrase a
 * human editor would strike without argument.
 */
const TELLS = [
  { re: /في\s+عالم(?:نا|\s+اليوم)?\s+المتسارع/, why: '«في عالمنا المتسارع» — افتتاحية مولّدات لا يكتبها إنسان في منشور.' },
  { re: /(?:ممّ?ا\s+لا\s+شكّ?\s+فيه|لا\s+شكّ?\s+(?:أنّ?|أن)|بلا\s+شكّ?|بكلّ?\s+تأكيد)/, why: 'تأكيد فارغ («لا شكّ أنّ»، «بكلّ تأكيد») — يُضعف ما بعده.' },
  { re: /من\s+الجدير\s+بالذكر/, why: '«من الجدير بالذكر» — لغة مقالات مدرسية.' },
  { re: /(?:^|\s)(?:في\s+الختام|ختامًا|وختامًا)/, why: '«في الختام» — المنشور ليس مقالًا يحتاج خاتمة معلَنة.' },
  { re: /(?:دعونا|لن?)\s*(?:نتعمّ?ق|نستكشف|نغوص)/, why: '«دعونا نتعمّق» — ترجمة حرفية لـ let\'s dive in.' },
  { re: /هل\s+تساءلت\s+يومًا/, why: '«هل تساءلت يومًا» — ترجمة حرفية لـ have you ever wondered.' },
  { re: /(?:في\s+هذا\s+(?:المنشور|المقال|الفيديو))/, why: '«في هذا المنشور» — القارئ يعرف أين هو.' },
  { re: /(?:يلعب|تلعب)\s+دورًا\s+(?:محوريًا|حيويًا|مهمًا|أساسيًا|بارزًا)/, why: '«يلعب دورًا محوريًا» — ترجمة لـ plays a pivotal role.' },
  { re: /تغيير\s+قواعد\s+اللعبة|يغيّ?ر\s+قواعد\s+اللعبة/, why: '«تغيير قواعد اللعبة» — ترجمة حرفية لـ game-changer.' },
  { re: /(?:إلى|الى)\s+مستوى\s+(?:آخر|جديد|أعلى)/, why: '«إلى مستوى آخر» — ترجمة لـ next level.' },
  { re: /حجر\s+الزاوية/, why: '«حجر الزاوية» — ترجمة لـ cornerstone، مستهلكة.' },
  { re: /في\s+نهاية\s+المطاف/, why: '«في نهاية المطاف» — ترجمة لـ at the end of the day.' },
  { re: /(?:المشهد|العالم)\s+الرقمي/, why: '«المشهد الرقمي» — ترجمة لـ digital landscape.' },
  { re: /لا\s+يخفى\s+على\s+أحد/, why: '«لا يخفى على أحد» — حشو.' },
  { re: /(?:رحلت(?:ك|نا|ه)\s+نحو|في\s+رحلة\s+(?:اكتشاف|البحث))/, why: '«رحلتك نحو» — استعارة journey المستهلكة.' },
  { re: /(?:سرّ?|مفتاح)\s+النجاح/, why: '«سرّ النجاح» — وعد عام بلا محتوى.' },
  { re: /(?:عالم|حياة)\s+(?:مليء|مليئة)\s+ب/, why: '«عالم مليء بـ» — افتتاحية مولّدات.' },
];

// ---------------------------------------------------------------------------
// Engagement bait
// ---------------------------------------------------------------------------

/**
 * Facebook's engagement-bait policy names five kinds and demotes all of them.
 * A real question is not bait: «ما التصرّف الذي يكشف لك …؟» asks for an answer
 * worth reading. «اكتب نعم» asks for a token, and that is what gets demoted.
 */
const BAIT = [
  { kind: 'comment-bait', re: /(?:اكتب|علّ?ق\s+ب(?:كلمة)?)\s*[«"]?(?:نعم|تم|تمّ|آمين|أوافق|١|1|👍|❤️)/, why: 'يطلب رمزًا لا رأيًا — فيسبوك يخفّض وصول «comment baiting».' },
  { kind: 'share-bait', re: /شار(?:ك|كوا)\s+(?:إن|إذا|لو|ل(?:يصل|تصل|نشر))/, why: 'يشترط المشاركة — فيسبوك يخفّض وصول «share baiting».' },
  { kind: 'tag-bait', re: /(?:منشن|اعمل\s+منشن|اذكر|أشِر\s+إلى)\s+(?:صديق|شخص|من)/, why: 'يطلب الإشارة إلى صديق — فيسبوك يخفّض وصول «tag baiting».' },
  { kind: 'react-bait', re: /(?:اضغط|ضع|اعمل)\s+(?:لايك|إعجاب|قلب)|لايك\s+(?:إذا|لو)/, why: 'يطلب تفاعلًا مشروطًا — فيسبوك يخفّض وصول «react baiting».' },
  { kind: 'vote-bait', re: /(?:لايك|قلب|إعجاب)\s+ل(?:ـ)?[^\s]+\s+و\s*(?:تعليق|قلب|لايك|واو)/, why: 'تصويت بالتفاعلات — فيسبوك يخفّض وصول «vote baiting».' },
];

/**
 * A number-as-answer prompt («اكتب رقمها») sits on the line: it invites an
 * opinion but asks for it as a token. Warn, do not refuse.
 */
const NUMBER_ANSWER_RE = /اكتب\s+(?:رقم(?:ها|ه)?|الرقم)/;

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/**
 * Facebook folds a post behind «عرض المزيد». With media attached the visible
 * text on a phone runs about two lines, which in Arabic is near 125 characters.
 * An approximation, stated as one: the fold moves with device and font size.
 */
const FOLD_CHARS = 125;
const MAX_HASHTAGS = 3;

const CTA_RE = /(?:[؟?]\s*(?:👇|⬇️)?\s*$)|(?:احفظ|أرسله|شارك|تابع|اكتب|أضف|أخبرني|أخبرنا|علّ?ق)/m;

/**
 * @param {string} text   a caption, or an on-frame line
 * @param {{surface?: 'caption'|'frame'}} [options]
 * @returns {{tells, bait, warnings}}
 */
function lintCopy(text, options = {}) {
  const src = stripBidiControls(String(text || ''));
  const tells = [];
  const bait = [];
  const warnings = [];

  for (const { re, why } of TELLS) {
    const m = src.match(re);
    if (m) tells.push({ rule: 'ai-tell', severity: 'warning', found: m[0].trim(), message: why });
  }
  for (const { kind, re, why } of BAIT) {
    const m = src.match(re);
    if (m) bait.push({ rule: kind, severity: 'error', found: m[0].trim(), message: why });
  }
  if (!bait.length && NUMBER_ANSWER_RE.test(src)) {
    warnings.push({
      rule: 'number-answer', severity: 'warning', found: src.match(NUMBER_ANSWER_RE)[0],
      message: '«اكتب رقمها» يطلب الرأي في صورة رمز — قريب من طُعم التعليق. '
        + 'سؤال مفتوح يجلب إجابات أطول وأنفع للوصول.',
    });
  }

  if (options.surface === 'caption') {
    const firstLine = src.split('\n').find((l) => l.trim()) || '';
    if (firstLine.length > FOLD_CHARS) {
      warnings.push({
        rule: 'hook-past-fold', severity: 'warning', chars: firstLine.length,
        message: `السطر الأول ${firstLine.length} حرفًا؛ ما بعد نحو ${FOLD_CHARS} يختفي خلف «عرض المزيد» على الهاتف. `
          + 'الخطّاف يجب أن يكتمل قبله.',
      });
    }
    const tags = src.match(/#[\p{L}\p{N}_]+/gu) || [];
    if (tags.length > MAX_HASHTAGS) {
      warnings.push({
        rule: 'hashtag-count', severity: 'info', count: tags.length,
        message: `${tags.length} وسمًا. على فيسبوك يكفي ${MAX_HASHTAGS} أو أقل؛ الوسوم هناك تصنيف لا وسيلة وصول.`,
      });
    }
    const asks = src.split('\n').filter((l) => CTA_RE.test(l)).length;
    if (asks > 2) {
      warnings.push({
        rule: 'many-asks', severity: 'warning', count: asks,
        message: `${asks} طلبات تفاعل في منشور واحد. اطلب شيئًا واحدًا — كل طلب إضافي يُضعف الأوّل.`,
      });
    }
  }

  return { tells, bait, warnings };
}

// ---------------------------------------------------------------------------
// The spine of a carousel or reel
// ---------------------------------------------------------------------------

/**
 * A frame sequence works when frame one earns the swipe, the best material
 * arrives early, and the last frame asks for exactly one thing.
 */
function checkSpine(outline) {
  const issues = [];
  const title = stripBidiControls(outline.title || '');
  const items = outline.items || [];

  // A promise has a number, a question, or a claim — not just a topic word.
  const promises = /[0-9٠-٩]|[؟?]|لماذا|كيف|لا\s|ليس|أخطاء|أسرار|قواعد|علامات|تصرّ?فات|طرق|خطوات/;
  if (title && !promises.test(title)) {
    issues.push({
      rule: 'hook-is-a-label', severity: 'warning',
      message: `العنوان «${title.replace(/\n/g, ' ')}» تسمية لا وعد. الإطار الأول يكسب التمرير بعدد أو سؤال أو ادّعاء.`,
    });
  }
  if (items.length > 10) {
    issues.push({
      rule: 'too-many-points', severity: 'warning', count: items.length,
      message: `${items.length} نقطة. بعد العاشرة يتسرّب المشاهدون — اقسمها منشورين.`,
    });
  }
  if (items.length && items.length < 3) {
    issues.push({
      rule: 'too-few-points', severity: 'info',
      message: 'أقلّ من ثلاث نقاط — ربما منشور واحد يكفي بدل ريل أو كاروسيل.',
    });
  }
  const asks = [outline.question, outline.cta].filter(Boolean).length;
  if (asks === 0) {
    issues.push({
      rule: 'no-ask', severity: 'warning',
      message: 'لا سؤال ولا طلب في الإطار الأخير. المشاهد وصل للنهاية — أعطه شيئًا يفعله.',
    });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Caption
// ---------------------------------------------------------------------------

/**
 * Assemble the caption skeleton from the outline the design was made from, so
 * the post and its caption can never drift apart.
 *
 * This is structure, not writing: the hook, the points as skimmable lines, one
 * ask, a handful of tags. The author edits the words; the shape is already
 * right when they start.
 */
function caption(outline) {
  // A caption the creator wrote is theirs: used as written, with every tag they
  // chose. The lint says if there are too many; it is not ours to cut.
  if (outline.captionText) {
    const own = (outline.hashtags || []).map((t) => (t.startsWith('#') ? t : `#${t}`));
    return [stripBidiControls(outline.captionText).trim(), own.length ? `\n${own.join(' ')}` : '']
      .join('\n').trim();
  }
  const hook = stripBidiControls(outline.hook || outline.lead || outline.title || '')
    .replace(/\n/g, ' ').trim();
  const points = (outline.items || [])
    .map((item, i) => `${item.num || ARABIC_DIGITS[i] || i + 1}. ${stripBidiControls(item.title)}`);
  const ask = stripBidiControls(outline.question || '').replace(/\n/g, ' ').trim();
  const save = outline.saveLine || '📌 احفظ المنشور، وأرسله لمن يحتاجه.';
  const tags = (outline.hashtags || []).slice(0, MAX_HASHTAGS)
    .map((t) => (t.startsWith('#') ? t : `#${t.replace(/\s+/g, '_')}`));

  return [hook, '', ...points, '', ask, save, tags.length ? `\n${tags.join(' ')}` : '']
    .filter((line, i, all) => !(line === '' && all[i - 1] === ''))
    .join('\n')
    .trim();
}

const ARABIC_DIGITS = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠'];

// ---------------------------------------------------------------------------
// Hook shapes by goal
// ---------------------------------------------------------------------------

/**
 * Which opening to reach for, by what the post is for. Skeletons, not scripts:
 * the brackets are for the author to fill.
 */
const HOOKS = {
  saves: [
    { name: 'قائمة معدودة', skeleton: '[عدد] [أشياء] تكشف/تصنع [نتيجة]' },
    { name: 'إطار قابل للنسخ', skeleton: 'الطريقة التي أ[فعل] بها [شيئًا] في [مدّة]' },
  ],
  shares: [
    { name: 'حقيقة معاكسة', skeleton: '[اعتقاد شائع] خطأ. الصحيح: [ادّعاء محدّد]' },
    { name: 'كسر الوهم', skeleton: 'ليس [ما يظنّه الناس]، بل [ما هو فعلًا]' },
  ],
  comments: [
    { name: 'لحظة مشتركة', skeleton: 'حين [موقف يعرفه الجميع]…' },
    { name: 'سؤال بلا جواب واحد', skeleton: 'ما [الشيء] الذي [يكشف/يغيّر] [نتيجة]؟' },
  ],
  follows: [
    { name: 'اعتراف له ثمن', skeleton: 'خسرت [شيئًا] قبل أن أفهم [درسًا]' },
    { name: 'سلسلة', skeleton: 'الجزء [رقم] من [سلسلة]: [وعد هذا الجزء]' },
  ],
};

/** A week that does not lean on one kind of post. */
const WEEKLY_MIX = { educational: 0.4, story: 0.3, engagement: 0.2, promotion: 0.1 };

module.exports = {
  TELLS, BAIT, HOOKS, WEEKLY_MIX, FOLD_CHARS, MAX_HASHTAGS,
  lintCopy, checkSpine, caption,
};
