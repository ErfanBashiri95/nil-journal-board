import { serve } from "std/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();

    // فعلاً فقط تست می‌کنیم که فانکشن کار می‌کنه
    return new Response(
      JSON.stringify({
        ok: true,
        received_chars: (body?.text || "").length,
        message: "Edge Function is working",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 }
    );
  }
});
