export async function composeArticleWithAI({ rawText, title, author, isFa = true }) {
    const r = await fetch("/.netlify/functions/compose-article", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText, title, author, isFa }),
    });
  
    const data = await r.json().catch(() => null);
  
    if (!r.ok) {
      const msg =
        data?.error ||
        data?.details?.message ||
        JSON.stringify(data || {}).slice(0, 300) ||
        "Request failed";
      throw new Error(msg);
    }
  
    return data; // {title, author, date, intro, body, conclusion, references}
  }
  