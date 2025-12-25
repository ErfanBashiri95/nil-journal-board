// src/utils/articleSynth.js

/* ===============================
   ابزارهای پایه
================================ */

// کلمات بی‌ارزش فارسی
const STOP_WORDS_FA = new Set([
    "و","یا","که","از","به","در","با","برای","این","آن","اما","اگر","زیرا","نیز",
    "می","می‌شود","می‌باشد","شد","شده","است","هست","بود","کرد","کردن","شود",
    "هم","همین","همان","خود","خودش","خودشان","ما","شما","آنها","اینها"
  ]);
  
  function normalizeFa(text) {
    return text
      .replace(/[‌]/g, " ")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  
  function splitSentences(text) {
    return text
      .split(/(?<=[.!؟\n])/)
      .map(s => s.trim())
      .filter(Boolean);
  }
  
  function limitWords(text, maxWords) {
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + " …";
  }
  
  /* ===============================
     استخراج کلیدواژه‌ها
  ================================ */
  
  function extractKeywordsFa(text, count = 6) {
    const normalized = normalizeFa(text);
    const words = normalized.split(" ");
  
    const freq = {};
    for (const w of words) {
      if (w.length < 3) continue;
      if (STOP_WORDS_FA.has(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
  
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([w]) => w);
  }
  
  /* ===============================
     ساخت بخش‌ها
  ================================ */
  
  function buildAbstract(text, maxWords) {
    const sentences = splitSentences(text);
    const joined = sentences.slice(0, 5).join(" ");
    return limitWords(joined, maxWords);
  }
  
  function buildIntro(text, maxWords) {
    const sentences = splitSentences(text);
    const intro = sentences.slice(0, 10).join(" ");
    return limitWords(intro, maxWords);
  }
  
  function buildBody(text, maxWords) {
    const sentences = splitSentences(text);
  
    const part1 = sentences.slice(0, Math.floor(sentences.length * 0.4)).join(" ");
    const part2 = sentences.slice(
      Math.floor(sentences.length * 0.4),
      Math.floor(sentences.length * 0.75)
    ).join(" ");
    const part3 = sentences.slice(Math.floor(sentences.length * 0.75)).join(" ");
  
    const body = `
  یافته‌ها و نکات کلیدی:
  ${part1}
  
  تحلیل و تفسیر:
  ${part2}
  
  پیامدها و پیشنهادها:
  ${part3}
    `.trim();
  
    return limitWords(body, maxWords);
  }
  
  function buildConclusion(text, maxWords) {
    const sentences = splitSentences(text);
    const tail = sentences.slice(-8).join(" ");
    return limitWords(tail, maxWords);
  }
  
  /* ===============================
     تابع اصلی
  ================================ */
  
  export function buildArticleFA(
    rawText,
    {
      abstractWords = 160,
      introWords = 300,
      bodyWords = 1100,
      conclusionWords = 160,
      keywordCount = 6,
    } = {}
  ) {
    const cleanText = normalizeFa(rawText);
  
    const keywords = extractKeywordsFa(cleanText, keywordCount);
  
    return {
      abstract: buildAbstract(cleanText, abstractWords),
      keywords,
      intro: buildIntro(cleanText, introWords),
      body: buildBody(cleanText, bodyWords),
      conclusion: buildConclusion(cleanText, conclusionWords),
    };
  }
  