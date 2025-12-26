// src/utils/articleComposer.js
// 25/50/25 واقعی بر اساس نسبت کلمات در هر منبع
// + ضدتکرار بین‌بخشی (حتی fallback)
// + نیم‌فاصله‌گذاری قواعدی فارسی (ها/های/می/نمی/ضمیرها...)

function normalize(s) {
    return String(s || "")
      .replace(/\u0000/g, "")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  
  function cleanupEntities(text) {
    let t = String(text || "");
  
    // حذف کنترل‌های bidi
    t = t.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, " ");
  
    // decode entity های رایج
    t = t
      .replace(/&quot;?/gi, '"')
      .replace(/&amp;?/gi, "&")
      .replace(/&lt;?/gi, "<")
      .replace(/&gt;?/gi, ">")
      .replace(/&nbsp;?/gi, " ")
      .replace(/&#39;?/gi, "'")
      .replace(/&apos;?/gi, "'");
  
    // حذف ته‌مانده‌های زشت
    t = t.replace(/\bquot;+\b/gi, "");
    t = t.replace(/\bamp;+\b/gi, "");
    t = t.replace(/\blt;+\b/gi, "");
    t = t.replace(/\bgt;+\b/gi, "");
  
    // ی/ک عربی + ه
    t = t.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/ۀ/g, "ه");
  
    // فضاهای اضافی
    t = t.replace(/[ \t]{2,}/g, " ");
    return t.trim();
  }
  
  /**
   * ✅ نیم‌فاصله‌گذاری قواعدی (ZWNJ = \u200c)
   * - برنامههای -> برنامه‌های
   * - مقاله ها -> مقاله‌ها
   * - می رود -> می‌رود
   * - نمی شود -> نمی‌شود
   * - خانه ام -> خانه‌ام
   */
  function fixPersianZwnj(text) {
    let t = String(text || "");
  
    // یکدست‌سازی فاصله‌ها
    t = t.replace(/\u200c/g, "\u200c"); // keep
    t = t.replace(/[ \t]{2,}/g, " ");
  
    // 1) ها / های
    // "کتابها" -> "کتاب‌ها"
    t = t.replace(/([\u0600-\u06FF])ها\b/g, "$1\u200cها");
    // "کتابهای" -> "کتاب‌های"
    t = t.replace(/([\u0600-\u06FF])های\b/g, "$1\u200cهای");
    // اگر "کتاب ها" نوشته بود -> "کتاب‌ها"
    t = t.replace(/([\u0600-\u06FF])\s+ها\b/g, "$1\u200cها");
    t = t.replace(/([\u0600-\u06FF])\s+های\b/g, "$1\u200cهای");
  
    // 2) تر / ترین
    t = t.replace(/([\u0600-\u06FF])\s*(تر|ترین)\b/g, "$1\u200c$2");
  
    // 3) می / نمی (پیشوند فعل)
    // "می رود" -> "می‌رود"
    t = t.replace(/\b(می|نمی)\s+([\u0600-\u06FF])/g, "$1\u200c$2");
  
    // 4) ضمیرهای متصل
    // "خانه ام" -> "خانه‌ام"
    t = t.replace(/([\u0600-\u06FF])\s+(ام|ات|اش|ای|ایم|اید|اند)\b/g, "$1\u200c$2");
    // اگر بدون فاصله: "خانهام" -> "خانه‌ام"
    t = t.replace(/([\u0600-\u06FF])(ام|ات|اش|ای|ایم|اید|اند)\b/g, "$1\u200c$2");
  
    // 5) فعل مرکب رایج "رفته اند" -> "رفته‌اند"
    t = t.replace(/([\u0600-\u06FF])\s+اند\b/g, "$1\u200cاند");
  
    // تمیزکاری نهایی
    t = t.replace(/[ \t]{2,}/g, " ").trim();
    return t;
  }
  
  function wordCount(text) {
    const t = String(text || "").trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }
  
  function strongNormalizeForKey(text) {
    return normalize(text)
      .replace(/\u200c/g, " ") // ZWNJ -> space
      .replace(/[ـ]/g, "") // اعراب/کشیده
      .replace(/[0-9۰-۹]/g, "") // اعداد
      .replace(/[^\u0600-\u06FFa-zA-Z ]+/g, " ") // علائم
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }
  
  function canonicalKey(text) {
    return strongNormalizeForKey(text).slice(0, 520);
  }
  
  function fingerprint(text) {
    return strongNormalizeForKey(text).slice(0, 200);
  }
  
  function extractParagraphsRobust(raw) {
    const t0 = normalize(raw);
    if (!t0) return [];
  
    let paras = t0.split(/\n{2,}/g).map(normalize).filter(Boolean);
    if (paras.length >= 3) return paras;
  
    const lines = t0.split(/\n+/g).map((x) => x.trim()).filter(Boolean);
    if (lines.length >= 6) {
      const out = [];
      let buf = "";
      for (const ln of lines) {
        const candidate = (buf ? buf + " " : "") + ln;
        if (candidate.length < 360) buf = candidate;
        else {
          if (buf) out.push(buf.trim());
          buf = ln;
        }
      }
      if (buf) out.push(buf.trim());
      return out.map(normalize).filter(Boolean);
    }
  
    const flat = t0.replace(/\s+/g, " ").trim();
    if (!flat) return [];
  
    const rough = flat.replace(/([؛.?!؟])\s+/g, "$1\n\n").trim();
    paras = rough.split(/\n{2,}/g).map(normalize).filter(Boolean);
    if (paras.length >= 3) return paras;
  
    const out = [];
    let i = 0;
    while (i < flat.length) {
      out.push(flat.slice(i, i + 460).trim());
      i += 460;
    }
    return out.filter(Boolean);
  }
  
  function uniqueKeepOrder(paras, usedKeys, usedFp) {
    const out = [];
    const localK = new Set();
    const localF = new Set();
  
    for (const p of paras) {
      const para = normalize(p);
      if (!para || para.length < 60) continue;
  
      const k = canonicalKey(para);
      const f = fingerprint(para);
  
      if (!k || k.length < 25) continue;
      if (!f || f.length < 60) continue;
  
      if (usedKeys && usedKeys.has(k)) continue;
      if (usedFp && usedFp.has(f)) continue;
  
      if (localK.has(k)) continue;
      if (localF.has(f)) continue;
  
      localK.add(k);
      localF.add(f);
      out.push(para);
    }
  
    return out;
  }
  
  function markUsedParas(paras, usedKeys, usedFp) {
    for (const p of paras) {
      const k = canonicalKey(p);
      const f = fingerprint(p);
      if (k && k.length >= 25) usedKeys.add(k);
      if (f && f.length >= 60) usedFp.add(f);
    }
  }
  
  function takeByWordBudget(paras, targetWords, minParas = 2) {
    const picked = [];
    let w = 0;
  
    for (const p of paras) {
      const pw = wordCount(p);
      if (!pw) continue;
  
      if (picked.length >= minParas && w + pw > targetWords) break;
  
      picked.push(p);
      w += pw;
  
      if (w >= targetWords && picked.length >= minParas) break;
    }
  
    if (picked.length < minParas) {
      for (const p of paras) {
        if (picked.length >= minParas) break;
        if (!picked.includes(p)) picked.push(p);
      }
    }
  
    return picked;
  }
  
  /**
   * ✅ تقسیم 25/50/25 با موقعیت کلمه‌ای داخل همان فایل
   */
  function bucketByPosition(paras) {
    const ps = paras.map(normalize).filter(Boolean);
    const weights = ps.map((p) => Math.max(1, wordCount(p)));
    const total = weights.reduce((a, b) => a + b, 0) || 1;
  
    const intro = [];
    const body = [];
    const conc = [];
  
    let cum = 0;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const w = weights[i];
      const center = (cum + w / 2) / total;
      cum += w;
  
      if (center < 0.25) intro.push(p);
      else if (center < 0.75) body.push(p);
      else conc.push(p);
    }
  
    return { intro, body, conc };
  }
  
  export function composeArticleFA(sources, opts = {}) {
    const introWords = Number(opts.introWords || 450);
    const bodyWords = Number(opts.bodyWords || 1100);
    const conclusionWords = Number(opts.conclusionWords || 450);
  
    const introPool = [];
    const bodyPool = [];
    const concPool = [];
  
    for (const s of sources || []) {
      const raw0 = s?.text || "";
      const raw = fixPersianZwnj(cleanupEntities(raw0));
  
      const paras = extractParagraphsRobust(raw)
        .map((p) => normalize(fixPersianZwnj(cleanupEntities(p))))
        .filter(Boolean);
  
      if (!paras.length) continue;
  
      const b = bucketByPosition(paras);
      introPool.push(...b.intro);
      bodyPool.push(...b.body);
      concPool.push(...b.conc);
    }
  
    // ✅ ضدتکرار بین‌بخشی (اصلی)
    const usedKeys = new Set();
    const usedFp = new Set();
  
    // INTRO
    const introUnique = uniqueKeepOrder(introPool, usedKeys, usedFp);
    const introPicked = takeByWordBudget(introUnique, introWords, 2);
    markUsedParas(introPicked, usedKeys, usedFp);
  
    // BODY (بعد از markUsed intro)
    const bodyUnique = uniqueKeepOrder(bodyPool, usedKeys, usedFp);
    const bodyPicked = takeByWordBudget(bodyUnique, bodyWords, 4);
    markUsedParas(bodyPicked, usedKeys, usedFp);
  
    // CONCLUSION
    const concUnique = uniqueKeepOrder(concPool, usedKeys, usedFp);
    const concPicked = takeByWordBudget(concUnique, conclusionWords, 2);
    markUsedParas(concPicked, usedKeys, usedFp);
  
    let introFinal = normalize(introPicked.join("\n\n"));
    let bodyFinal = normalize(bodyPicked.join("\n\n"));
    let concFinal = normalize(concPicked.join("\n\n"));
  
    /**
     * ✅ FIX اصلی تکرار شما:
     * اگر مقدمه خالی شد، از ابتدای بدنه قرض می‌گیریم
     * اما باید همان پاراگراف‌ها را در usedKeys/Fp علامت بزنیم
     * و بعد بدنه را دوباره بسازیم تا تکرار نشود.
     */
    if (!introFinal) {
      const bodyUniqueForIntro = uniqueKeepOrder(bodyPool, usedKeys, usedFp);
      const fallbackIntro = takeByWordBudget(
        bodyUniqueForIntro,
        Math.max(220, Math.floor(introWords * 0.7)),
        2
      );
  
      // مهم: اینجا باید به usedGlobal اضافه شود
      markUsedParas(fallbackIntro, usedKeys, usedFp);
  
      introFinal = normalize(fallbackIntro.join("\n\n"));
  
      // بدنه دوباره با usedGlobal جدید
      const bodyReUnique = uniqueKeepOrder(bodyPool, usedKeys, usedFp);
      const bodyRePicked = takeByWordBudget(bodyReUnique, bodyWords, 4);
      bodyFinal = normalize(bodyRePicked.join("\n\n"));
    }
  
    introFinal = normalize(fixPersianZwnj(introFinal));
    bodyFinal = normalize(fixPersianZwnj(bodyFinal));
    concFinal = normalize(fixPersianZwnj(concFinal));
  
    return {
      intro: introFinal,
      body: bodyFinal,
      conclusion: concFinal,
      stats: {
        introWords: wordCount(introFinal),
        bodyWords: wordCount(bodyFinal),
        conclusionWords: wordCount(concFinal),
        totalWords: wordCount(introFinal) + wordCount(bodyFinal) + wordCount(concFinal),
      },
    };
  }
  