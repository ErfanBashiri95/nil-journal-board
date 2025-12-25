function normalize(s) {
    return String(s || "")
      .replace(/\u0000/g, "")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  
  /**
   * ✅ پایان‌جمله معتبر:
   * - . ! ? ؟ … "۔"
   * - بعضی PDFها از "٫" یا "·" یا "…" استفاده می‌کنن (اما ما این‌ها رو پایان‌جمله رسمی حساب نمی‌کنیم)
   * - فقط نشانه‌های واقعی پایان جمله را می‌پذیریم.
   */
  const END_PUNCT_RE = /[.!?؟…\u06D4](?:[\)\]\}»”"'›»]+)?$/;
  
  /**
   * ✅ استخراج فقط «جملات کامل»
   * - جمله باید واقعاً با پایان‌جمله تمام شود
   * - جمله باید حداقل طول داشته باشد
   * - هیچ نقطه‌ای اضافه نمی‌کنیم
   */
  function extractFullSentences(text) {
    const t = normalize(text);
    if (!t) return [];
  
    const flat = t.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
    if (!flat) return [];
  
    // جمله = هرچیزی که به پایان‌جمله ختم شود (non-greedy)
    const re = /(.+?[.!?؟…\u06D4])(?=\s|$)/g;
    const out = [];
    let m;
  
    while ((m = re.exec(flat)) !== null) {
      const sent = normalize(m[1]);
      if (sent.length >= 25 && END_PUNCT_RE.test(sent)) out.push(sent);
    }
  
    return out;
  }
  
  function wordCount(text) {
    const t = String(text || "").trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }
  
  function hash32(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  
  function mulberry32(a) {
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  
  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  
  /**
   * chunk = گروهی از «جملات کامل»
   * ✅ chunk فقط وقتی پذیرفته می‌شود که آخرش پایان‌جمله واقعی داشته باشد.
   */
  function chunkify(sentences, rnd) {
    const chunks = [];
    let i = 0;
  
    while (i < sentences.length) {
      const size = Math.min(sentences.length - i, 3 + Math.floor(rnd() * 3)); // 3..5
      const group = sentences.slice(i, i + size);
  
      // همه باید جمله کامل باشند
      const allOk = group.every((s) => END_PUNCT_RE.test(String(s || "").trim()));
      if (allOk) {
        const chunk = normalize(group.join(" "));
        if (chunk && chunk.length >= 60 && END_PUNCT_RE.test(chunk)) {
          chunks.push(chunk);
        }
      }
  
      i += size;
    }
  
    return chunks;
  }
  
  function interleave(sourceChunks, rnd) {
    for (const s of sourceChunks) shuffle(s.chunks, rnd);
  
    const out = [];
    let anyLeft = true;
  
    while (anyLeft) {
      anyLeft = false;
      const order = sourceChunks.map((_, i) => i);
      shuffle(order, rnd);
  
      for (const idx of order) {
        const src = sourceChunks[idx];
        if (src.chunks.length) {
          out.push(src.chunks.shift());
          anyLeft = true;
        }
      }
    }
    return out;
  }
  
  /**
   * ✅ ساخت متن بدون برش
   * - هیچ وقت وسط جمله / وسط chunk قطع نمی‌کنیم.
   */
  function buildByWordBudget_NoCut(chunks, targetWords) {
    const out = [];
    let used = 0;
  
    for (const ch of chunks) {
      const w = wordCount(ch);
      if (!w) continue;
  
      if (used + w > targetWords) break;
  
      if (END_PUNCT_RE.test(ch)) {
        out.push(ch);
        used += w;
      }
  
      if (used >= targetWords) break;
    }
  
    return normalize(out.join("\n\n"));
  }
  
  /**
   * ✅ فقط پاراگراف‌هایی را نگه می‌داریم که خودشان با پایان‌جمله تمام می‌شوند.
   * - اگر پاراگراف پایان‌جمله ندارد: حذف می‌شود (نه trim و نه نقطه اضافه)
   * - این تضمین می‌کند «هیچ پاراگراف نصفه» چاپ نشود.
   */
  function finalizeParagraphsStrict(text) {
    const t = normalize(text);
    if (!t) return "";
  
    const paras = t
      .split(/\n{2,}/g)
      .map((p) => normalize(p))
      .filter(Boolean);
  
    const fixed = paras.filter((p) => END_PUNCT_RE.test(p) && p.length >= 40);
  
    // اگر همه حذف شدند، هیچ چیز برنگردان (بهتر از نصفه)
    return normalize(fixed.join("\n\n"));
  }
  
  /**
   * ✅ اگر خروجیِ یک بخش با پایان‌جمله تمام نشد،
   * از chunkهای بعدی (همان بخش) اضافه می‌کنیم تا به پایان‌جمله برسد.
   * - بدون اضافه کردن نقطه
   * - بدون بریدن
   */
  function ensureSectionEndsWell(chunks, targetWords, maxExtraChunks = 8) {
    // اول طبق بودجه بساز
    let txt = buildByWordBudget_NoCut(chunks, targetWords);
    txt = finalizeParagraphsStrict(txt);
  
    if (!txt) return "";
  
    // اگر آخرش درست نیست، chunk اضافه کن تا درست شود
    if (END_PUNCT_RE.test(txt)) return txt;
  
    // حالت خیلی نادر: اگر به هر دلیلی آخرش پایان‌جمله نشد، تلاش با اضافه کردن
    let used = wordCount(txt);
    let added = 0;
    const out = txt.split(/\n{2,}/g).filter(Boolean);
  
    for (const ch of chunks) {
      if (added >= maxExtraChunks) break;
      const w = wordCount(ch);
      if (!w) continue;
  
      // chunk باید درست تمام شود
      if (!END_PUNCT_RE.test(ch)) continue;
  
      out.push(ch);
      used += w;
      added++;
  
      const candidate = finalizeParagraphsStrict(out.join("\n\n"));
      if (candidate && END_PUNCT_RE.test(candidate)) return candidate;
    }
  
    // اگر هم نشد، آخرین پاراگراف مشکل‌دار را حذف کن
    const cleaned = finalizeParagraphsStrict(out.join("\n\n"));
    return cleaned;
  }
  
  /**
   * ✅ Export اصلی
   * - مقدمه: 25% اول هر فایل
   * - بدنه: 50% میانی هر فایل
   * - نتیجه گیری: 25% آخر هر فایل
   * - پاراگراف‌ها ۱۰۰٪ با پایان‌جمله واقعی تمام می‌شوند
   * - هیچ نقطه‌ای اضافه نمی‌کنیم
   */
  export function composeArticleFA(sources, opts = {}) {
    const seed = String(opts.seed || "niljournal");
    const rnd = mulberry32(hash32(seed));
  
    const introWords = Number(opts.introWords || 550);
    const bodyWords = Number(opts.bodyWords || 2300);
    const conclusionWords = Number(opts.conclusionWords || 650);
  
    const introRatio = 0.25;
    const conclusionRatio = 0.25;
  
    const introBuckets = [];
    const bodyBuckets = [];
    const conclusionBuckets = [];
  
    for (const s of sources || []) {
      const text = normalize(s?.text);
      if (!text) continue;
  
      const sentences = extractFullSentences(text);
      if (sentences.length < 10) continue; // سخت‌تر تا کیفیت بیاد بالا
  
      const n = sentences.length;
  
      const introEnd = Math.max(2, Math.floor(n * introRatio));
      const concStart = Math.max(introEnd + 2, Math.floor(n * (1 - conclusionRatio)));
  
      const introSent = sentences.slice(0, introEnd);
      const bodySent = sentences.slice(introEnd, concStart);
      const concSent = sentences.slice(concStart);
  
      const introChunks = chunkify(introSent, rnd);
      const bodyChunks = chunkify(bodySent, rnd);
      const concChunks = chunkify(concSent, rnd);
  
      if (introChunks.length) introBuckets.push({ chunks: introChunks.slice() });
      if (bodyChunks.length) bodyBuckets.push({ chunks: bodyChunks.slice() });
      if (concChunks.length) conclusionBuckets.push({ chunks: concChunks.slice() });
    }
  
    const mixedIntro = introBuckets.length ? interleave(introBuckets, rnd) : [];
    const mixedBody = bodyBuckets.length ? interleave(bodyBuckets, rnd) : [];
    const mixedConc = conclusionBuckets.length ? interleave(conclusionBuckets, rnd) : [];
  
    // fallback pool اگر بخشی خالی شد (ولی باز هم فقط chunkهای معتبر)
    const poolAll = [...mixedIntro, ...mixedBody, ...mixedConc].filter((x) => END_PUNCT_RE.test(String(x || "").trim()));
  
    // ✅ اینجا سفت و سخت پایان‌جمله را تضمین می‌کنیم
    const intro = ensureSectionEndsWell(mixedIntro.length ? mixedIntro : poolAll, introWords);
    const body = ensureSectionEndsWell(mixedBody.length ? mixedBody : poolAll, bodyWords);
    const conclusion = ensureSectionEndsWell(mixedConc.length ? mixedConc : poolAll, conclusionWords);
  
    return {
      intro,
      body,
      conclusion,
      stats: {
        introWords: wordCount(intro),
        bodyWords: wordCount(body),
        conclusionWords: wordCount(conclusion),
        totalWords: wordCount(intro) + wordCount(body) + wordCount(conclusion),
      },
    };
  }
  