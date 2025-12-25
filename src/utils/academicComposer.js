// src/utils/academicComposer.js
// خلاصه‌سازی استخراجی + ساختار مقاله آکادمیک (رایگان، بدون API)

const STOP_FA = new Set([
    "و","در","به","از","که","را","با","برای","این","آن","یک","یا","اما","تا","می","شود","شده","کرد","کرده",
    "بر","نیز","هم","هر","چه","اگر","ضمن","بین","روی","پس","باید","است","هست","بود","باشد","شد","همه","چون"
  ]);
  
  function normalizeFa(s) {
    return (s || "")
      .replace(/\u200c/g, " ")
      .replace(/[ي]/g, "ی")
      .replace(/[ك]/g, "ک")
      .replace(/[ۀ]/g, "ه")
      .replace(/[^\S\r\n]+/g, " ")
      .trim();
  }
  
  function splitSentencesFa(text) {
    const t = normalizeFa(text)
      .replace(/[\r]+/g, "\n")
      .replace(/[؛]/g, "؛ ")
      .replace(/[.?!؟]+/g, m => m + " ");
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
    return (s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
  
  export function composeAcademicArticleFA(rawText, { title = "", keywords = [] } = {}) {
    const clean = normalizeFa(rawText);
    const sentences = splitSentencesFa(clean);
  
    const selected = pickTopSentences(sentences, 0.25, 10, 26);
  
    const abstract = selected.slice(0, 4).join(" ");
    const intro = selected.slice(4, 10).join(" ");
    const body = selected.slice(10, 20).join(" ");
    const conclusion = (selected.slice(20).length ? selected.slice(20) : selected.slice(-3)).join(" ");
  
    const finalTitle = safeTitle(title);
    const finalKeywords = (keywords && keywords.length ? keywords : ["پژوهش", "تحلیل", "مطالعه"]).slice(0, 6);
  
    // خروجی HTML آماده‌ی چاپ
    return `
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
        <p>${escapeHtml(abstract)}</p>
        <p class="keywords"><strong>کلیدواژه‌ها:</strong> ${escapeHtml(finalKeywords.join("، "))}</p>
      </section>
  
      <section>
        <h2>مقدمه</h2>
        <p>${escapeHtml(intro)}</p>
      </section>
  
      <section>
        <h2>بدنه و تحلیل</h2>
        <p>${escapeHtml(body)}</p>
      </section>
  
      <section>
        <h2>نتیجه‌گیری</h2>
        <p>${escapeHtml(conclusion)}</p>
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
  