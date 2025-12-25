// supabase/functions/journal_grok_article/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GROK_API_KEY = Deno.env.get("GROK_API_KEY");

if (!GROK_API_KEY) {
  throw new Error("GROK_API_KEY is not set in Supabase secrets");
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { text, language = "fa" } = await req.json();

    if (!text || typeof text !== "string" || text.length < 200) {
      return new Response(
        JSON.stringify({ error: "Input text is too short or invalid" }),
        { status: 400 }
      );
    }

    const systemPrompt =
      language === "fa"
        ? `
تو یک دستیار علمی هستی.
فقط بر اساس متن ورودی کار کن.
هیچ اطلاعات جدیدی اضافه نکن.
هیچ جمله‌ای از خودت نساز.

از کل متن، یک مقاله آکادمیک منسجم تولید کن با ساختار زیر:

1. چکیده
2. کلیدواژه‌ها (حداکثر 8)
3. مقدمه
4. بدنه‌ی اصلی (تحلیلی، ترکیبی، مخلوط از کل منابع)
5. نتیجه‌گیری

محتوا باید کاملاً ترکیبی از همه بخش‌های متن باشد، نه پشت سر هم.
`
        : `
You are an academic assistant.
Use ONLY the provided text.
Do not add new information.

Generate a structured academic article with:
Abstract, Keywords, Introduction, Body, Conclusion.
`;

    const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!grokRes.ok) {
      const errText = await grokRes.text();
      return new Response(
        JSON.stringify({ error: errText }),
        { status: 500 }
      );
    }

    const data = await grokRes.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content returned from Grok" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 }
    );
  }
});
