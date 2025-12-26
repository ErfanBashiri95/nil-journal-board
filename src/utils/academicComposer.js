// src/utils/academicComposer.js
// خلاصه‌سازی استخراجی + ساختار مقاله آکادمیک (رایگان، بدون API)

const STOP_FA = new Set([
    "و","در","به","از","که","را","با","برای","این","آن","یک","یا","اما","تا","می","شود","شده","کرد","کرده",
    "بر","نیز","هم","هر","چه","اگر","ضمن","بین","روی","پس","باید","است","هست","بود","باشد","شد","همه","چون"
  ]);
  
  function normalizeFa(s) {
    return String(s || "")
      .replace(/\u200c/g, " ") // ZWNJ -> space
      .replace(/[ي]/g, "ی")
      .replace(/[ك]/g, "ک")
      .replace(/[ۀ]/g, "ه")
      .replace(/[^\S\r\n]+/g, " ")
      .trim();
  }
  
  /**
   * ✅ Decode HTML entities که توی PDF-extract زیاد پیش میاد:
   * &quot; &amp; &lt; &gt; &#39; &nbsp;
   * این باعث میشه "quot&" و ... چاپ نشه و متن طبیعی بشه.
   */
  function decodeHtmlEntities(input) {
    const s = String(input || "");
    if (!s) return "";
    return s
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  }
  
  function splitSentencesFa(text) {
    const t = normalizeFa(text)
      .replace(/[\r]+/g, "\n")
      .replace(/[؛]/g, "؛ ")
      .replace(/[.?!؟]+/g, m => m + " ");
  
    // جمله‌ها
    return t
      .split(/(?<=[\.\!\؟\?])\s+|\n+/g)
      .map(x => x.trim())
      .filter(x => x.length >= 20);
  }
  
  function tokenizeFa(s) {
    return normalizeFa(s)
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\s0-9]+/g, " ")
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w && w.length >= 2 && !STOP_FA.has(w));
  }
  
  function buildWordFreq(sentences) {
    const freq = new Map();
    for (const sen of sentences) {
      for (const w of tokenizeFa(sen)) {
        freq.set(w, (freq.get(w) || 0) + 1);
      }
    }
    return freq;
  }
  
  function scoreSentence(sen, freq) {
    const words = tokenizeFa(sen);
    if (!words.length) return 0;
    let score = 0;
    for (const w of words) score += (freq.get(w) || 0);
    return score / Math.sqrt(words.length);
  }
  
  function pickTopSentences(sentences, ratio = 0.25, min = 8, max = 22) {
    const freq = buildWordFreq(sentences);
    const scored = sentences.map((s, i) => ({ i, s, score: scoreSentence(s, freq) }));
    scored.sort((a, b) => b.score - a.score);
  
    const k = Math.min(max, Math.max(min, Math.floor(sentences.length * ratio)));
    const picked = scored.slice(0, k).sort((a, b) => a.i - b.i);
    return picked.map(x => x.s);
  }
  
  function safeTitle(s) {
    const t = normalizeFa(s || "");
    return t ? t : "مقاله پژوهشی";
  }
  
  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
  
  /**
   * ✅ ساخت پاراگراف از چند جمله (برای اینکه متن خوش‌خوان بشه)
   */
  function sentencesToParagraphs(sentences, perPara = 3) {
    const out = [];
    for (let i = 0; i < sentences.length; i += perPara) {
      const chunk = sentences.slice(i, i + perPara).join(" ");
      if (normalizeFa(chunk).length >= 20) out.push(chunk);
    }
    return out;
  }
  
  function renderParasHtml(paras) {
    return paras.map(p => `<p>${escapeHtml(p)}</p>`).join("\n");
  }
  
  export function composeAcademicArticleFA(rawText, { title = "", keywords = [] } = {}) {
    // ✅ اول entityها رو decode کن تا "quot&..." چاپ نشه
    const decoded = decodeHtmlEntities(rawText);
  
    const clean = normalizeFa(decoded);
    const sentences = splitSentencesFa(clean);
  
    // اگر متن خیلی کم بود، خروجی خالی نده
    const selected = sentences.length
      ? pickTopSentences(sentences, 0.25, 10, 30)
      : [];
  
    // تقسیم منطقی جملات بین بخش‌ها
    const abstractS = selected.slice(0, 4);
    const introS = selected.slice(4, 12);
    const bodyS = selected.slice(12, 24);
    const conclusionS = selected.slice(24).length ? selected.slice(24) : selected.slice(-4);
  
    const finalTitle = safeTitle(title);
    const finalKeywords = (keywords && keywords.length ? keywords : ["پژوهش", "تحلیل", "مطالعه"]).slice(0, 6);
  
    // ✅ پاراگراف‌پاراگراف
    const abstractP = sentencesToParagraphs(abstractS, 2);
    const introP = sentencesToParagraphs(introS, 3);
    const bodyP = sentencesToParagraphs(bodyS, 3);
    const conclusionP = sentencesToParagraphs(conclusionS, 2);
  
    // ✅ اگر مقدمه خالی شد، از بهترین جملات باقی‌مانده کمک می‌گیریم
    if (!introP.length && selected.length) {
      introP.push(...sentencesToParagraphs(selected.slice(0, 6), 3));
    }
  
    // خروجی HTML آماده‌ی چاپ + CSS ضد صفحه‌خالی
    return `
    <style>
      /* پایه */
      .paper { direction: rtl; font-family: Vazirmatn, Tahoma, Arial, sans-serif; line-height: 1.9; font-size: 12.5pt; }
      .title-block { text-align: center; margin-bottom: 18px; }
      .title-block h1 { margin: 0 0 8px 0; font-size: 20pt; }
      .meta { display:flex; justify-content:space-between; gap:12px; font-size: 10.5pt; opacity: .85; }
      section { margin-top: 14px; }
      h2 { margin: 0 0 8px 0; font-size: 14pt; }
      p { margin: 0 0 10px 0; text-align: justify; }
      .keywords { margin-top: 6px; }
      .refs ol { margin: 0; padding-right: 20px; }
  
      /* ✅ ضد صفحه خالی بین تیتر و متن */
      @media print {
        h2, .title-block, section {
          break-before: auto !important;
          break-after: auto !important;
          page-break-before: auto !important;
          page-break-after: auto !important;
        }
        section { break-inside: avoid; page-break-inside: avoid; }
        h2 + p { margin-top: 0 !important; }
      }
    </style>
  
    <article class="paper">
      <header class="title-block">
        <h1>${escapeHtml(finalTitle)}</h1>
        <div class="meta">
          <div>تهیه‌کننده: کاربر سامانه NIL</div>
          <div>تاریخ تولید: ${new Date().toLocaleDateString("fa-IR")}</div>
        </div>
      </header>
  
      <section>
        <h2>چکیده</h2>
        ${renderParasHtml(abstractP)}
        <p class="keywords"><strong>کلیدواژه‌ها:</strong> ${escapeHtml(finalKeywords.join("، "))}</p>
      </section>
  
      <section>
        <h2>مقدمه</h2>
        ${renderParasHtml(introP)}
      </section>
  
      <section>
        <h2>بدنه و تحلیل</h2>
        ${renderParasHtml(bodyP)}
      </section>
  
      <section>
        <h2>نتیجه‌گیری</h2>
        ${renderParasHtml(conclusionP)}
      </section>
  
      <section class="refs">
        <h2>منابع</h2>
        <ol>
          <li>این مقاله به‌صورت خودکار از فایل‌های بارگذاری‌شده و یادداشت‌های کاربر استخراج و خلاصه‌سازی شده است.</li>
        </ol>
      </section>
    </article>
    `;
  }
  