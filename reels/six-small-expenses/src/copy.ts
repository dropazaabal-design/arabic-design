// The approved text, exactly as written in the brief. tools/copycheck.mjs compares it with storyboard.json.
export const T = {
  title: { line1: '6 مصاريف صغيرة تستنزف راتبك', line2: 'دون أن تنتبه:' },
  items: [
    { n: '1', head: 'اشتراكات لا تستخدمها:', body: 'يتجدد خصمها، وأنت نسيت وجودها.' },
    { n: '2', head: 'قهوة جاهزة يوميًا:', body: 'المبلغ بسيط؛ التكرار يجعله أكبر.' },
    { n: '3', head: 'رسوم توصيل متكررة:', body: 'تدفع مقابل الراحة مع كل طلب.' },
    { n: '4', head: 'إضافات عند الدفع:', body: 'قطعة صغيرة لم تكن في قائمتك.' },
    { n: '5', head: 'سناكات عند كل توقف:', body: 'تشتريها تلقائيًا، دون قرار مسبق.' },
    { n: '6', head: 'باقات أكبر من حاجتك:', body: 'تدفع مقابل مزايا لا تستخدمها.' },
  ],
  close: 'راجع التكرار، لا السعر فقط.',
  handle: '@kitabwbs',
} as const;
