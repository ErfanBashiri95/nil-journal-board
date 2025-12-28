export async function handler(event) {
    try {
      if (event.httpMethod !== "POST") {
        return json(405, { error: "Method not allowed" });
      }
  
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return json(500, { error: "OPENAI_API_KEY is missing on server" });
  
      const body = safeJson(event.body) || {};
      const rawText = String(body.rawText || "").trim();
      const title = String(body.title || "").trim();
      const author = String(body.author || "").trim();
      const isFa = body.isFa !== false; // default true
  
      if (!rawText || rawText.length < 200) {
        return json(400, { error: "rawText too short (min ~200 chars)" });
      }
  
      const system = isFa
        ? "تو یک ویراستار آکادمیک فارسی هستی. خروجی فقط JSON معتبر باشد و هیچ متن اضافه‌ای نده."
        : "You are an academic editor. Output must be valid JSON only.";
  
      const user = isFa
        ? buildFaPrompt({ rawText, title, author })
        : buildEnPrompt({ rawText, title, author });
  
      const payload = {
        model: "gpt-5-mini",
        reasoning: { effort: "none" },
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      };
  
      const r = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        return json(r.status, { error: "OpenAI failed", details: data?.error || data });
      }
  
      const text = extractResponseText(data);
      const parsed = safeJson(text);
  
      if (!parsed || typeof parsed !== "object") {
        return json(500, { error: "Model output not JSON", raw: String(text).slice(0, 1200) });
      }
  
      const finalOut = isFa ? postProcessFa(parsed) : parsed;
      return json(200, finalOut);
    } catch (e) {
      return json(500, { error: e?.message || "Unknown error" });
    }
  }
  
  function buildFaPrompt({ rawText, title, author }) {
    return `
  متن خام زیر را به یک «مقاله ساده و تمیز» تبدیل کن.
  
  قوانین خیلی مهم:
  1) فقط JSON خروجی بده. هیچ توضیحی ننویس.
  2) خروجی دقیقاً این فیلدها را داشته باشد:
  {
    "title": "...",
    "author": "...",
    "date": "fa-IR",
    "intro": "پاراگراف‌ها با دو خط جدید جدا شوند",
    "body": "...",
    "conclusion": "...",
    "references": "..."
  }
  3) تقسیم‌بندی 25/50/25 رعایت شود (±5%):
  - intro حدود 25%
  - body حدود 50%
  - conclusion حدود 25%
  4) هیچ پاراگراف/جمله‌ای بین بخش‌ها تکرار نشود.
  5) پاراگراف‌ها کامل باشند و با . ؟ ! … یا "۔" تمام شوند.
  6) متن را تا حد امکان از همان متن خام بردار (ویرایش حداقلی مجاز است).
  7) منابع: اگر منبع مشخص نداریم، یک خط استاندارد بنویس که متن از فایل کاربر استخراج شده است.
  
  عنوان: ${title || "مقاله"}
  نویسنده: ${author || "کاربر سامانه NIL"}
  
  متن خام:
  <<<
  ${rawText}
  >>>
  `.trim();
  }
  
  function buildEnPrompt({ rawText, title, author }) {
    return `
  Convert the raw text into a clean simple academic article.
  
  Rules:
  1) Output JSON only.
  2) Exact schema:
  {
    "title": "...",
    "author": "...",
    "date": "en-US",
    "intro": "paragraphs separated by blank line",
    "body": "...",
    "conclusion": "...",
    "references": "..."
  }
  3) 25/50/25 split (±5%).
  4) No repetition across sections.
  5) Paragraphs must end with proper punctuation.
  6) Minimal edits; prefer extracting from raw text.
  
  Title: ${title || "Article"}
  Author: ${author || "NIL User"}
  
  RAW:
  <<<
  ${rawText}
  >>>
  `.trim();
  }
  
  function extractResponseText(data) {
    if (typeof data?.output_text === "string") return data.output_text;
  
    const out = data?.output;
    if (Array.isArray(out)) {
      for (const item of out) {
        const content = item?.content;
        if (Array.isArray(content)) {
          for (const c of content) {
            if (typeof c?.text === "string") return c.text;
          }
        }
      }
    }
    return JSON.stringify(data);
  }
  
  function safeJson(s) {
    try {
      if (typeof s !== "string") return s;
      return JSON.parse(s);
    } catch {
      return null;
    }
  }
  
  function json(statusCode, obj) {
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(obj),
    };
  }
  
  // ✅ Persian clean: نیم‌فاصله برای ها/های و چند نرمال‌سازی پایه
  function postProcessFa(article) {
    const norm = (s) =>
      String(s ?? "")
        .replace(/[ي]/g, "ی")
        .replace(/[ك]/g, "ک")
        .replace(/[ۀ]/g, "ه")
        .replace(/[^\S\r\n]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
  
    const fixZwnj = (s) => {
      let t = norm(s);
  
      // کلمهها -> کلمه‌ها
      t = t.replace(/([\u0600-\u06FF])ها\b/g, "$1\u200cها");
      // کلمه های -> کلمه‌های
      t = t.replace(/([\u0600-\u06FF])\s+های\b/g, "$1\u200cهای");
      // کلمههای -> کلمه‌های
      t = t.replace(/([\u0600-\u06FF])های\b/g, "$1\u200cهای");
  
      // تر/ترین فاصله
      t = t.replace(/([\u0600-\u06FF])(تر|ترین)\b/g, "$1 $2");
  
      // فاصله اطراف علائم
      t = t.replace(/\s+([،؛:!؟])/g, "$1");
      t = t.replace(/([.?!؟…])([^\s])/g, "$1 $2");
  
      return t.trim();
    };
  
    return {
      ...article,
      title: fixZwnj(article.title),
      author: fixZwnj(article.author),
      date: norm(article.date),
      intro: fixZwnj(article.intro),
      body: fixZwnj(article.body),
      conclusion: fixZwnj(article.conclusion),
      references: fixZwnj(article.references),
    };
  }
  