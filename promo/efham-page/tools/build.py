"""Builds index.html from tools/template.html and data/books.json.

usage: python3 tools/build.py   (then upload index.html and assets/ to the site root)
The price, the dollar amount and the payment link are set once, below. The 99 titles come from the previous page
(data/books.json); the facts (pages per file, summaries per track) from the six PDFs.
"""
import html
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent

# ═══ Settings ═══
PRICE = '99'  # riyals, as shown on the page (one price, no discount, no deadline)
USD = '26.40'  # what Buy Me a Coffee charges
CHECKOUT = 'https://buymeacoffee.com/kitabwbs/e/566923'
PICK = 1  # the track open by default (0-based): «العادات», as in the ad

ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس']
PAGES = [47, 89, 104, 99, 104, 70]  # counted in the PDFs (513 in all)
SHORT = ['المال', 'العادات', 'فهم النفس', 'العلاقات', 'القيادة', 'الانضباط']
CONCERN = [
    'دخلي وعلاقتي بالمال: أبي أفهم كيف يُبنى ويُدار',
    'انضباطي ووقتي: أأجّل كثير وأتشتّت بسرعة',
    'راحتي النفسية: قلق ومقارنة وتفكير ما يهدأ',
    'علاقاتي وتأثيري: أبي أُقنع وأتفاهم وأقرأ الناس صح',
    'شغلي وقيادتي: قرارات أوضح وتفكير أعمق',
    'دافعي وثقتي: أبي أنهض وأستمر بلا أعذار',
]
FAQ = [
    ('كيف راح يوصلني البكج بعد الدفع؟', 'بمجرد ما تتم عملية الدفع يظهر لك رابط التحميل على الشاشة مباشرة، ويوصلك كمان على بريدك خلال دقائق. لو ما وصلك، تحقّق من مجلّد الرسائل غير المرغوبة أو راسلنا ونرسله لك يدويًا.'),
    ('الدفع مرة واحدة ولا اشتراك شهري؟', f'مرة واحدة بس. تدفع {PRICE} ريالًا وتحصل على الملفات الستة ملكك مدى الحياة، بلا تجديد ولا رسوم لاحقة، وأي تحديثات مستقبلية توصلك مجانًا.'),
    ('هل يغنيني عن قراءة الكتب الأصلية؟', 'لا، وما راح ندّعي كذا. الخلاصة تعطيك فكرة الكتاب الجوهرية وخطواته العملية، وتدلّك على أي كتاب يستاهل تقرأه كامل. كثير يستخدمونه كمرشّح: يقرأ الخلاصة، وإذا شدّته يشتري الكتاب كامل.'),
    ('اشتريت أشياء مثل كذا قبل وما فتحتها!', 'صار مع كثير. الفرق هنا إن الخلاصة الوحدة نحو 15 دقيقة مو 6 ساعات، وتنتهي بـ3 خطوات محدّدة تسوّيها بكرة. تبدأ بوحدة الليلة، والباقي ينتظرك.'),
    ('على أي أجهزة يشتغل؟', 'ملفات PDF عادية تفتحها على الآيفون والأندرويد والآيباد واللابتوب، بلا تطبيق خاص وبلا إنترنت بعد التحميل. والفهرس داخل كل ملف قابل للنقر.'),
    ('هل المحتوى منقول من مواقع أو من الكتب نفسها؟', 'لا. الخلاصات صياغة أصلية من إنتاجنا: قرأنا الكتاب، واستخرجنا مفاهيمه، وأعدنا كتابته ببنية موحّدة من خمس محطات. أسماء الكتب ومؤلفيها مذكورة للتعريف بمصدر الفكرة، والنص نفسه ما هو منسوخ من الكتاب ولا من ملخصات جاهزة على الإنترنت.'),
    ('كم حجم الملفات؟ وكم ياخذ التحميل؟', 'ستة ملفات PDF، مجموعها أقل من 60 ميجابايت، تحمّلها كلها في أقل من دقيقة على أي إنترنت عادي، وتفتح على أي جهاز بلا تطبيق خاص.'),
    ('أقدر أطبع البكج ورقيًا؟', 'نعم، تقدر تطبعه لاستخدامك الشخصي. الممنوع هو إعادة البيع أو النشر أو التداول: الملف ملكك أنت، مو رخصة توزيع.'),
    ('في كم يوم أخلص البكج كامل؟', 'لو قرأت خلاصة كل ليلة: 99 ليلة، يعني أقل من أربعة أشهر. ولو قرأت خلاصتين في اليوم: أقل من شهرين. وما فيه ترتيب إجباري، ابدأ بالمسار اللي يخصّك.'),
    ('هل فيه نسخة صوتية؟', 'الإصدار الحالي نصّي (PDF) فقط. وإذا نزلت نسخة صوتية لاحقًا، توصلك مجانًا باعتبارها من تحديثات الإصدارات القادمة المشمولة في شرائك.'),
    ('الدفع ما نجح معي، وش أسوي؟', 'جرّب طريقة ثانية داخل صفحة الدفع (Apple Pay أو Google Pay أو PayPal أو بطاقة مختلفة)، وتأكد إن بطاقتك مفعّل عليها الشراء الدولي عبر الإنترنت. وإذا استمرت المشكلة راسلنا على ‎@kitabwbs ونرتّبها لك بأنفسنا.'),
    ('وش الفرق بين الخلاصة والملخصات المجانية على يوتيوب؟', 'الملخص المجاني يعطيك «وش يقول الكتاب». الخلاصة عندنا تعطيك بنية ثابتة: المشكلة اللي يحلّها، و5 مفاهيم بقواعدها، وحالتين من الواقع، و3 خطوات بمؤشرات قياس، وقاعدة ذهبية. وتملكها مكتوبة، تبحث فيها وترجع لها بلا إنترنت.'),
    ('ليش السعر بالدولار عند الدفع؟', f'لأن الدفع يتم عبر منصة Buy Me a Coffee وهي تتعامل بالدولار. المبلغ المخصوم من بطاقتك {USD} دولارًا لكل الدول، والسعر بالريال تقريبي يساعدك على التقدير.'),
]


def count(n, one, few, many):
    """Arabic counted noun: 3–10 take the plural, 11–99 the singular (by the last two digits)."""
    r = n % 100
    return f'{n} {few if 3 <= r <= 10 else one if r >= 11 or r == 0 else many}'


e = html.escape
vols = json.loads((root / 'data/books.json').read_text(encoding='utf-8'))
assert sum(len(v['books']) for v in vols) == 99 and sum(PAGES) == 513

q = 'كم كتابًا اشتريت… وما زال ينتظر؟'.split()
question = ' '.join(f'<span class="w" style="--k:{k}">{e(w)}</span>' + ('<br>' if k == 2 else '') for k, w in enumerate(q))  # one line each: the purchase, then the wait

# the six covers in a fan: track 1 on the right, each next one in front and to the left, so every title shows
fan = []
for i in range(6):
    rz = (2.5 - i) * 1.8
    fan.append(f'<img src="assets/cover-{i + 1}.webp" width="560" height="792" alt="غلاف المسار {ORD[i]}: {e(vols[i]["title"])}"'
               f' style="--i:{i};right:{5 + i * 10.4:.1f}%;top:{6 + abs(i - 2.5) * 2.2:.1f}%;z-index:{i + 1};--t:rotate({rz:.1f}deg)"'
               f'{"" if i == 0 else " loading=\"lazy\""}>')

tabs, panels = [], []
for i, v in enumerate(vols):
    on = i == PICK
    tabs.append(f'<button class="tab" type="button" role="tab" id="tab-{i + 1}" aria-controls="track-{i + 1}" aria-selected="{str(on).lower()}" tabindex="{0 if on else -1}">'
                f'<span class="concern">{e(CONCERN[i])}</span><span class="which">المسار {ORD[i]}: {e(v["title"])}</span></button>')
    by = lambda b: e(b['a']) if b['a'] else 'خلاصة مدرسة فكرية'  # summaries with no single author synthesise a school of thought
    books = ''.join(f'<li><div><b>{e(b["t"])}</b><span>{by(b)}</span></div></li>' for b in v['books'])
    panels.append(f'<div class="panel" role="tabpanel" id="track-{i + 1}" aria-labelledby="tab-{i + 1}" tabindex="0">'  # all open without script; the script shows one
                  f'<div class="panel-head"><img src="assets/cover-{i + 1}.webp" width="560" height="792" loading="lazy" alt="غلاف المسار {ORD[i]}">'
                  f'<div><h3>المسار {ORD[i]}: {e(v["title"])}</h3><p class="count">{count(len(v["books"]), "خلاصة", "خلاصات", "خلاصة")}، {count(PAGES[i], "صفحة", "صفحات", "صفحة")}</p>'
                  f'</div></div><p class="blurb">{e(v["blurb"])}</p>'
                  f'<p class="start">ابدأ بـ«{e(v["start"])}».</p>'
                  f'<ol class="books" aria-label="خلاصات المسار {ORD[i]}">{books}</ol></div>')

icon = '<svg viewBox="0 0 30 39" aria-hidden="true"><path d="M9 1.5H28.5V37.5H1.5V9Z" fill="rgba(46,123,197,.14)" stroke="#2E7BC5" stroke-width="2.4" stroke-linejoin="round"/><path d="M9 1.5V9H1.5" fill="none" stroke="#2E7BC5" stroke-width="2.4" stroke-linejoin="round"/><path d="M8 20H22M8 25H22M8 30H17" stroke="#2E7BC5" stroke-width="2" stroke-linecap="round" opacity=".7"/></svg>'
files = ''.join(f'<li>{icon}<b>المسار {ORD[i]}: {e(v["title"])}</b><span>{count(len(v["books"]), "خلاصة", "خلاصات", "خلاصة")}، {count(PAGES[i], "صفحة", "صفحات", "صفحة")}</span></li>' for i, v in enumerate(vols))
files += '<li class="sum"><span></span><b>6 ملفات، 99 خلاصة، 513 صفحة، و297 خطوة تطبيقية</b><span></span></li>'

faq = ''.join(f'<details><summary>{e(a)}</summary><p>{e(b)}</p></details>' for a, b in FAQ)

ld = {'@context': 'https://schema.org', '@graph': [
    {'@type': 'Organization', '@id': 'https://kitabwbs.com/#org', 'name': 'كتاب وبس', 'url': 'https://kitabwbs.com', 'sameAs': ['https://x.com/kitabwbs']},
    {'@type': 'WebSite', '@id': 'https://kitabwbs.com/#site', 'url': 'https://kitabwbs.com', 'name': 'بكج افهم نفسك', 'inLanguage': 'ar', 'publisher': {'@id': 'https://kitabwbs.com/#org'}},
    {'@type': 'Product', '@id': 'https://kitabwbs.com/#product', 'name': 'بكج افهم نفسك: 99 خلاصة كتاب',
     'description': '99 خلاصة لأشهر كتب التطوير في 6 مسارات، ستة ملفات PDF و513 صفحة. كل خلاصة تُقرأ في نحو 15 دقيقة وتنتهي بثلاث خطوات تطبيقية بمؤشرات قياس.',
     'brand': {'@id': 'https://kitabwbs.com/#org'}, 'category': 'ملخصات كتب', 'inLanguage': 'ar', 'numberOfPages': 513,
     'image': ['https://kitabwbs.com/assets/og-image.jpg'],
     'offers': {'@type': 'Offer', 'url': 'https://kitabwbs.com/#deal', 'price': USD, 'priceCurrency': 'USD', 'availability': 'https://schema.org/InStock',
                'itemCondition': 'https://schema.org/NewCondition', 'seller': {'@id': 'https://kitabwbs.com/#org'},
                'hasMerchantReturnPolicy': {'@type': 'MerchantReturnPolicy', 'applicableCountry': 'SA', 'returnPolicyCategory': 'https://schema.org/MerchantReturnNotPermitted', 'merchantReturnLink': 'https://kitabwbs.com/#faq'}}},
    {'@type': 'FAQPage', '@id': 'https://kitabwbs.com/#faq', 'mainEntity': [{'@type': 'Question', 'name': a, 'acceptedAnswer': {'@type': 'Answer', 'text': b}} for a, b in FAQ]},
]}

page = (root / 'tools/template.html').read_text(encoding='utf-8')
for k, v in {'__LDJSON__': json.dumps(ld, ensure_ascii=False, indent=1), '__QUESTION__': question, '__FAN__': ''.join(fan),
             '__TABS__': ''.join(tabs), '__PANELS__': ''.join(panels), '__FILES__': files, '__FAQ__': faq,
             '__PRICE__': PRICE, '__USD__': USD, '__CHECKOUT__': CHECKOUT}.items():
    page = page.replace(k, v)
assert '__' not in page.replace('__proto__', ''), 'a placeholder was left'
(root / 'index.html').write_text(page, encoding='utf-8')
print(f'index.html: {len(page) // 1024} KB, 99 titles, {len(FAQ)} questions, price {PRICE} SAR ({USD} USD)')
