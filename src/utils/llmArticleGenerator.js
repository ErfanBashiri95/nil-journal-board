// تولید مقاله آکادمیک با Supabase Edge Function (compose-article)
// - همه PDFها + همه Noteها
// - بالانس ورودی هر منبع تا مدل فقط یکی رو نخوره
// - خروجی JSON + source_coverage

import { supabase } from "../lib/supabaseClient"; // مسیر رو مطابق پروژه خودت تنظیم کن

function normalize(s) {
  return String(s || "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// بالانس متن هر منبع (خیلی مهم)
function balancedText(text, max = 6000) {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  const half = Math.floor(max / 2);
  return t.slice(0, half) + "\n...\n" + t.slice(-half);
}

/**
 * sources: آرایه‌ای از منابع (pdf/note) به شکل:
 * [{ sourceLabel: "pdf: ...", text: "..." }, ...]
 */
export async function generateAcademicArticleFA({
  sources,
  title = "مقاله پژوهشی",
  isFa = true,
} = {}) {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error("هیچ منبعی برای ساخت مقاله ارسال نشده است.");
  }

  // 1) مطمئن شو همه منابع واقعاً وارد payload می‌شن و بالانس دارن
  const sourcesForLLM = sources
    .map((s, i) => {
      const label = String(s?.sourceLabel || s?.label || `Source ${i + 1}`);
      const text = normalize(s?.text || "");
      return {
        sourceLabel: label,
        text: balancedText(text, 6000),
      };
    })
    .filter((x) => x.text && x.text.length > 0);

  if (sourcesForLLM.length === 0) {
    throw new Error("متن منابع خالی است.");
  }

  // 2) صدا زدن Edge Function
  const { data, error } = await supabase.functions.invoke("compose-article", {
    body: {
      title,
      isFa,
      sources: sourcesForLLM,
    },
  });

  if (error) {
    throw new Error(error.message || "خطا در فراخوانی compose-article");
  }

  // data: { intro, body, conclusion, source_coverage }
  if (!data?.intro || !data?.body || !data?.conclusion) {
    throw new Error("خروجی مقاله ناقص است.");
  }

  return {
    title,
    intro: normalize(data.intro),
    body: normalize(data.body),
    conclusion: normalize(data.conclusion),
    source_coverage: data.source_coverage || {},
  };
}
