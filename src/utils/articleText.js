// src/utils/articleText.js
import { extractPdfTextFromUrl } from "./pdfText";

/* =========================================
   Stopwords (FA)
========================================= */
const FA_STOPWORDS = new Set([
  "و","یا","اما","ولی","که","این","آن","هم","همه","هر","هیچ","نه","تا","از","به","در","با","برای","بر",
  "را","رو","های","هایی","کرد","کردن","شود","شد","می","می‌شود","می‌کنیم","می‌کند",
  "می‌کنند","می‌باشد","است","هست","بود","باشند","باشد","نیست","هستند","دارد","دارند","داشت","داشتند",
  "اگر","چون","پس","بنابراین","همچنین","ضمن","البته","یعنی","مثل","مانند","تقریباً","کاملاً","بسیار",
  "خیلی","کم","زیاد","بیشتر","کمتر","چند","چگونه","چه","چرا","کجا","وقتی","زمانی","همین","همان",
  "یک","دو","سه","چهار","پنج","اول","دوم","سوم","چهارم","پنجم",
  "ما","من","تو","شما","او","ایشان","آنها","اینها",
  "روی","بین","بدون","داخل","خارج","قبل","بعد","حین",
  "استفاده","مورد","موارد","نحوه","فرایند","فرآیند","روش","راه","راهکار","نتیجه","نتایج","هدف","اهداف",
  "مسئله","مشکل","چالش","راه‌حل","راهحل","راه‌کار","بهبود","توسعه","ارزیابی","تحلیل","بررسی",
]);

/* =========================================
   Helpers
========================================= */
function normalizeFa(s) {
  return String(s || "")
    .replace(/\u200c/g, "‌")
    .replace(/[ـ]/g, "")
    .replace(/[“”„"]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/\s+/g, " ")
    .trim();
}

function stripSeparators(raw) {
  return String(raw || "")
    .replace(/={3,}.*?={3,}\s*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function safeSplitParagraphs(text) {
  const t = normalizeFa(stripSeparators(text));
  if (!t) return [];
  // پاراگراف‌ها: بر اساس خط خالی
  return t
    .replace(/\r/g, "")
    .split(/\n\s*\n+/g)
    .map((p) => normalizeFa(p))
    .filter(Boolean)
    .filter((p) => p.length >= 30);
}

/**
 * ✅ مخلوط‌سازی واقعی فایل‌ها/نوت‌ها:
 * - هر chunk را به پاراگراف تبدیل می‌کند
 * - Round-robin از همه chunkها یکی‌یکی پاراگراف برمی‌دارد
 * - نتیجه: دیگر پشت سر هم (فایل1 بعد فایل2) نیست
 */
export function mixCorpusChunks(chunks, opts = {}) {
  const { maxParagraphs = 280 } = opts; // سقف برای کنترل حجم
  const groups = (Array.isArray(chunks) ? chunks : [])
    .map((c) => safeSplitParagraphs(c))
    .filter((arr) => arr.length > 0);

  if (groups.length === 0) return "";

  const out = [];
  let added = 0;
  let step = 0;

  // round-robin
  while (added < maxParagraphs) {
    let progressed = false;

    for (let i = 0; i < groups.length; i++) {
      const arr = groups[i];
      const idx = step; // در هر دور، اندیس ثابت
      if (idx < arr.length) {
        out.push(arr[idx]);
        added++;
        progressed = true;
        if (added >= maxParagraphs) break;
      }
    }

    if (!progressed) break;
    step++;
  }

  return out.join("\n\n").trim();
}

function splitToSentencesFa(text) {
  const t = normalizeFa(stripSeparators(text));
  if (!t) return [];

  const rough = t
    .replace(/\r/g, "")
    .split(/(?<=[\.\!\?؟])\s+|(?<=\n)\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const out = [];
  for (const s of rough) {
    const clean = normalizeFa(s);
    if (clean.length < 28) continue;
    if (/^[\d\W_]+$/.test(clean)) continue;
    out.push(clean);
  }
  return out;
}

function tokenizeFa(text) {
  return normalizeFa(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s‌-]+/gu, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((x) => x.trim())
    .filter(Boolean);
}

function isGoodToken(tok) {
  if (!tok) return false;
  if (tok.length < 3) return false;
  if (FA_STOPWORDS.has(tok)) return false;
  if (/^\d+$/.test(tok)) return false;
  if (["the","and","or","of","to","in","on","for","with","a","an"].includes(tok)) return false;
  return true;
}

function buildFrequency(tokens) {
  const freq = new Map();
  for (const t of tokens) {
    if (!isGoodToken(t)) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return freq;
}

function sentenceScore(sentence, freq) {
  const tokens = tokenizeFa(sentence);
  let score = 0;
  let count = 0;

  for (const t of tokens) {
    if (!isGoodToken(t)) continue;
    score += (freq.get(t) || 0);
    count++;
  }
  if (!count) return 0;

  const len = sentence.length;
  const base = score / Math.sqrt(count);
  const penalty = len > 360 ? 0.82 : 1;
  return base * penalty;
}

function countWordsFa(text) {
  const toks = tokenizeFa(text).filter(Boolean);
  return toks.length;
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens.filter(isGoodToken));
  const b = new Set(bTokens.filter(isGoodToken));
  if (a.size === 0 || b.size === 0) return 0;

  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * انتخاب جمله تا رسیدن به بودجه کلمه، با تنوع و جلوگیری از تکرار
 */
function pickSentencesToWordBudget(sentences, freq, wordBudget, opts = {}) {
  const {
    maxSim = 0.52, // اگر شباهت زیاد بود رد شود
    minGap = 0, // فعلاً استفاده نمی‌کنیم
    hardMaxSentences = 120,
  } = opts;

  const scored = sentences
    .map((s, idx) => ({
      s,
      idx,
      sc: sentenceScore(s, freq),
      tok: tokenizeFa(s),
      w: countWordsFa(s),
    }))
    .filter(x => x.sc > 0 && x.w >= 6);

  scored.sort((a, b) => b.sc - a.sc);

  const picked = [];
  let totalW = 0;

  for (const item of scored) {
    if (picked.length >= hardMaxSentences) break;
    if (totalW >= wordBudget) break;

    // تنوع: خیلی شبیه قبلی‌ها نباشه
    let tooSimilar = false;
    for (const p of picked) {
      if (jaccard(item.tok, p.tok) > maxSim) {
        tooSimilar = true;
        break;
      }
    }
    if (tooSimilar) continue;

    picked.push(item);
    totalW += item.w;

    if (totalW >= wordBudget) break;
  }

  // ترتیب طبیعی متن حفظ شود تا خوانا شود
  picked.sort((a, b) => a.idx - b.idx);
  return picked.map(x => x.s);
}

function extractKeyPhrases(text, topK = 8) {
  const tokens = tokenizeFa(text).filter(isGoodToken);
  const freq1 = buildFrequency(tokens);

  const freq2 = new Map();
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i], b = tokens[i + 1];
    if (!isGoodToken(a) || !isGoodToken(b)) continue;
    const bi = `${a} ${b}`;
    freq2.set(bi, (freq2.get(bi) || 0) + 1);
  }

  const cands = [];
  for (const [k, v] of freq2.entries()) if (v >= 2) cands.push({ k, v: v * 2.2 });
  for (const [k, v] of freq1.entries()) if (v >= 3) cands.push({ k, v });

  cands.sort((a, b) => b.v - a.v);

  const out = [];
  const used = new Set();
  for (const c of cands) {
    if (out.length >= topK) break;
    const key = c.k;
    if (used.has(key)) continue;

    const parts = key.split(" ");
    const overlaps = parts.some(p => used.has(p));
    if (overlaps && key.includes(" ")) continue;

    out.push(key);
    used.add(key);
  }

  if (out.length < topK) {
    const singles = [...freq1.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]);
    for (const s of singles) {
      if (out.length >= topK) break;
      if (used.has(s)) continue;
      out.push(s);
      used.add(s);
    }
  }

  return out.slice(0, topK);
}

function makeIntroFa(keywords, abstract) {
  const kw = (keywords || []).slice(0, 5).join("، ");
  const a = normalizeFa(abstract);
  return normalizeFa(
`این مقاله با اتکا به مجموعه‌ای از فایل‌های متنی و یادداشت‌های کاربر تهیه شده و هدف آن ارائه‌ی یک جمع‌بندی منسجم از مضمون‌های اصلیِ مشترک است. محورهای پرتکرار متن شامل ${kw || "موضوعات مرکزی استخراج‌شده از متن"} می‌باشند. در ادامه، ابتدا چکیده و سپس طرح مسئله و زمینه (مقدمه) ارائه می‌شود و بعد از آن، روشِ استخراج و یکپارچه‌سازی، یافته‌ها و تحلیل، بحث و در پایان نتیجه‌گیری ارائه خواهد شد.
${a ? `\n\nخلاصه‌ی اولیه: ${a}` : ""}`
  );
}

function makeMethodFa(keywords) {
  const kw = (keywords || []).slice(0, 6).join("، ");
  return normalizeFa(
`## روش اجرا
داده‌های این مقاله از دو منبع اصلی تشکیل شده است: (۱) فایل‌های متنی بارگذاری‌شده توسط کاربر (مانند PDFهای متنی استخراج‌شده) و (۲) یادداشت‌های ثبت‌شده در سامانه. ابتدا متن‌ها استخراج و پاکسازی شدند (حذف نویسه‌های زائد، یکسان‌سازی فاصله‌ها و ادغام پاراگراف‌ها). سپس، متنِ ترکیبی به جمله‌ها شکسته شد و با امتیازدهی مبتنی بر فراوانی واژه‌های کلیدی، جملاتِ نماینده برای هر بخش انتخاب گردید تا خروجی نهایی، تصویری جامع و یکپارچه ارائه دهد. کلیدواژه‌های محوری این تحلیل شامل ${kw || "کلیدواژه‌های پرتکرار متن"} است.`
  );
}

function makeConclusionFa(summary, keywords) {
  const kw = (keywords || []).slice(0, 6).join("، ");
  const s = normalizeFa(summary);
  return normalizeFa(
`جمع‌بندی این مقاله نشان می‌دهد که مضمون‌های مشترک منابع ورودی عمدتاً پیرامون محورهای ${kw || "اصلی"} سازمان یافته‌اند. بر اساس یافته‌ها و تحلیل، می‌توان نتیجه گرفت: ${s || "الگوهای کلیدی متن از طریق هم‌پوشانی مضامین و تکرار مفاهیم اصلی قابل مشاهده است."} در گام‌های بعدی، با افزودن داده‌های تکمیلی یا نمونه‌های میدانی، می‌توان دقت و عمق تحلیل را افزایش داد.`
  );
}

/**
 * ✅ ساخت مقاله فارسی با بودجه کلمه‌ای و ساختار استاندارد
 * options:
 * - targetTotalWords: پیش‌فرض 3200 (برای 8 تا 12 صفحه)
 */
export function buildArticleFA(rawText, options = {}) {
  const clean = normalizeFa(stripSeparators(rawText));
  const sentences = splitToSentencesFa(clean);

  const totalWords = countWordsFa(clean);

  // اگر خیلی کوتاه بود، ساده برگردون
  if (sentences.length < 8 || totalWords < 500) {
    const keywords = extractKeyPhrases(clean, 8);
    const abs = clean.slice(0, 900);
    const intro = makeIntroFa(keywords, abs.slice(0, 260));
    const method = makeMethodFa(keywords);
    const conclusion = makeConclusionFa(clean.slice(-260), keywords);

    const body = normalizeFa(
      `## یافته‌ها و تحلیل\n${clean}\n\n## بحث\n${clean.slice(0, 420)}\n\n## نتیجه‌گیری\n${conclusion}`
    );

    return {
      abstract: abs,
      keywords,
      intro,
      body,
      conclusion,
      method, // اگر بعداً خواستی جدا چاپ کنی
      stats: { totalWords, mode: "short" },
    };
  }

  const freq = buildFrequency(tokenizeFa(clean));
  const keywords = extractKeyPhrases(clean, 9);

  // ---- بودجه‌ها (کلمه) ----
  const targetTotalWords = Math.max(2400, Math.min(3800, Number(options.targetTotalWords || 3200)));

  // scale based on available corpus (اگر متن کم/زیاد بود کمی تنظیم)
  const scale = Math.max(0.7, Math.min(1.15, totalWords / targetTotalWords));

  const budgets = {
    abstract: Math.round(190 * Math.min(1, scale)),
    intro: Math.round(470 * Math.min(1, scale)),
    findings: Math.round(1500 * Math.min(1, scale)),
    discussion: Math.round(520 * Math.min(1, scale)),
    conclusion: Math.round(230 * Math.min(1, scale)),
  };

  // ---- انتخاب بخش‌ها با عدم تکرار شدید ----
  const abstractS = pickSentencesToWordBudget(sentences, freq, budgets.abstract, { maxSim: 0.56, hardMaxSentences: 10 });
  const abstract = abstractS.join(" ");

  // intro: تنوع بیشتر
  const introS = pickSentencesToWordBudget(sentences, freq, budgets.intro, { maxSim: 0.48, hardMaxSentences: 22 });
  const introCore = introS.join(" ");
  const intro = makeIntroFa(keywords, abstract) + "\n\n" + introCore;

  // findings: بخش اصلی
  const findingsS = pickSentencesToWordBudget(sentences, freq, budgets.findings, { maxSim: 0.44, hardMaxSentences: 70 });
  const findings = findingsS.join("\n\n");

  // discussion: کمی تفسیری‌تر (از همان جمله‌های مهم ولی با تنوع سختگیرانه‌تر)
  const discussionS = pickSentencesToWordBudget(sentences, freq, budgets.discussion, { maxSim: 0.42, hardMaxSentences: 28 });
  const discussion = discussionS.join("\n\n");

  // conclusion: از بهترین جمله‌های بدنه/بحث یک خلاصه کوتاه بساز
  const summaryForConclusion = pickSentencesToWordBudget(
    splitToSentencesFa(findings + "\n" + discussion),
    buildFrequency(tokenizeFa(findings + " " + discussion)),
    budgets.conclusion,
    { maxSim: 0.6, hardMaxSentences: 10 }
  ).join(" ");

  const conclusion = makeConclusionFa(summaryForConclusion, keywords);

  const method = makeMethodFa(keywords);

  // ✅ بدنه نهایی با ساختار مقاله (داخل body) — بدون نیاز به تغییر printPdf.js
  const body = normalizeFa(
`## روش اجرا
${method.replace(/^##\s*روش اجرا\s*/m, "").trim()}

## یافته‌ها و تحلیل
${findings}

## بحث
${discussion}

## نتیجه‌گیری
${conclusion}`
  );

  return {
    abstract,
    keywords,
    intro,
    body,
    conclusion,
    method,
    discussion,
    stats: {
      totalWords,
      targetTotalWords,
      budgets,
      mode: "structured",
    },
  };
}

/* =========================================
   PDF extract + clean
========================================= */
export async function extractAndCleanPdf(url, lang = "fa") {
  const rtl = (lang || "fa") === "fa";
  const raw = await extractPdfTextFromUrl(url, { rtl });

  let text = String(raw || "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}
