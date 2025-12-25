/**
 * ❌ No AI
 * ❌ No Supabase Edge Function
 * ✅ Local article composition helper
 *
 * This file now ONLY normalizes and prepares text
 * to be used by buildArticleFA / buildArticleEN
 */

export async function composeArticleWithSupabase(
    text,
    lang = "fa"
  ) {
    if (!text || typeof text !== "string") {
      throw new Error("متن ورودی برای ساخت مقاله خالی است");
    }
  
    const cleanText = text
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s+/g, " ")
      .trim();
  
    if (!cleanText) {
      throw new Error("متن بعد از پاکسازی خالی شد");
    }
  
    return {
      content: cleanText,
      lang,
      stats: {
        length: cleanText.length,
        words: cleanText.split(/\s+/).length,
      },
    };
  }
  