// src/utils/printPdf.js

export function openPrintWindow(title = "NIL Article") {
  const w = window.open("", "_blank");
  if (!w) throw new Error("Pop-up blocked! لطفاً Pop-up را اجازه بده.");

  w.document.open();
  w.document.write(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px}
    .box{max-width:820px;margin:auto;border:1px solid #ddd;border-radius:12px;padding:16px}
    .muted{color:#666}
  </style>
</head>
<body>
  <div class="box">
    <h3>در حال آماده‌سازی PDF…</h3>
    <p class="muted">لطفاً این تب را نبندید. چند ثانیه صبر کنید.</p>
  </div>
</body>
</html>
`);
  w.document.close();

  return w;
}

export async function renderAndPrintInWindow(printWin, article, filename, isFa) {
  const watermarkText = "NIL JOURNAL";

  const safe = (v) =>
    String(v ?? "").replace(/[&<>"]/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    }[c]));

  // ✅ فقط پاراگراف‌هایی را نگه می‌داریم که حداقل یک پایان جمله واقعی دارند
  // (بدون اضافه کردن نقطه)
  const trimToLastSentenceEnd = (text) => {
    const t = String(text ?? "").replace(/\r/g, "").trim();
    if (!t) return "";

    const paras = t
      .split(/\n{2,}/g)
      .map((p) => p.trim())
      .filter(Boolean);

    const endRe = /[\.!\?؟…\u06D4]/g; // . ! ? ؟ … ۔

    const cleaned = paras
      .map((p) => {
        const s = p.replace(/\s+/g, " ").trim();
        if (!s) return "";

        let lastIdx = -1;
        let m;
        while ((m = endRe.exec(s)) !== null) lastIdx = m.index;

        if (lastIdx < 0) return ""; // اگر پایان جمله ندارد، حذفش کن
        return s.slice(0, lastIdx + 1).trim();
      })
      .filter(Boolean);

    return cleaned.join("\n\n");
  };

  const title = safe(article?.title || (isFa ? "مقاله" : "Article"));
  const author = safe(article?.author || "");
  const date = safe(article?.date || "");

  const intro = safe(trimToLastSentenceEnd(article?.intro || ""));
  const body = safe(trimToLastSentenceEnd(article?.body || ""));
  const conclusion = safe(trimToLastSentenceEnd(article?.conclusion || ""));
  const references = safe(String(article?.references || "").trim());

  const html = `<!doctype html>
<html lang="${isFa ? "fa" : "en"}" dir="${isFa ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8" />
  <title>${safe(filename || "NIL-Article")}</title>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;800;900&family=Inter:wght@400;600;800&display=swap');
  </style>

  <style>
    html, body { height: 100%; }
    body {
      margin: 0;
      font-family: ${isFa ? "'Vazirmatn', Arial, sans-serif" : "'Inter', Arial, sans-serif"};
      color: #111;
      line-height: 1.9;
      font-size: 12pt;
      background: #fff;
    }

    .sheet {
      width: 210mm;
      height: 297mm;
      box-sizing: border-box;
      padding: 16mm 16mm 18mm 16mm;
      position: relative;
      page-break-after: always;
      overflow: hidden;

      /* ✅ کلید: ارتفاع واقعی با Flex (نه calc میلیمتری) */
      display: flex;
      flex-direction: column;
    }
    .sheet:last-child { page-break-after: auto; }

    /* Border ONLY left & right */
    .border-l, .border-r {
      position: absolute;
      top: 14mm;
      bottom: 14mm;
      width: 0;
      border-left: 3px solid #666;
      pointer-events: none;
      z-index: 1;
    }
    .border-l { left: 14mm; }
    .border-r { right: 14mm; }

    .watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 0;
    }
    .watermark span {
      font-size: 42pt;
      font-weight: 900;
      opacity: 0.07;
      transform: rotate(-25deg);
      letter-spacing: 2px;
      white-space: nowrap;
      max-width: 92vw;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .content {
      position: relative;
      z-index: 2;
      box-sizing: border-box;

      /* ✅ کلید: این باعث میشه همیشه دقیق تا قبل فوتر فضا داشته باشیم */
      flex: 1 1 auto;
      overflow: hidden;
      padding-bottom: 4mm; /* فقط کمی فاصله */
    }

    .footer {
      flex: 0 0 auto;
      text-align: center;
      font-size: 10pt;
      color: #444;
      z-index: 3;
      pointer-events: none;
      padding-top: 2mm;
    }

    .header { text-align: center; margin-bottom: 10mm; }
    .header h1 { margin: 0 0 5mm 0; font-size: 18pt; font-weight: 900; }
    .meta {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      font-size: 10.5pt;
      color: #333;
      border-top: 1px solid #aaa;
      padding-top: 5mm;
    }

    .h2 {
      margin: 8mm 0 4mm 0;
      font-size: 13.5pt;
      font-weight: 900;
      border-bottom: 1px solid #ccc;
      padding-bottom: 2mm;
    }
    .p { margin: 0 0 4mm 0; text-align: justify; }

    @media print {
      @page { size: A4; margin: 0; }
      body { margin: 0; }
    }
  </style>
</head>

<body>
  <div id="pages"></div>

  <script>
    function createSheet() {
      const sheet = document.createElement("div");
      sheet.className = "sheet";

      const watermark = document.createElement("div");
      watermark.className = "watermark";
      const w = document.createElement("span");
      w.textContent = "${safe(watermarkText)}";
      watermark.appendChild(w);

      const borderL = document.createElement("div");
      borderL.className = "border-l";

      const borderR = document.createElement("div");
      borderR.className = "border-r";

      const content = document.createElement("div");
      content.className = "content";

      const footer = document.createElement("div");
      footer.className = "footer";
      footer.innerHTML = '${isFa ? "صفحه " : "Page "} <span class="pno"></span>';

      sheet.appendChild(watermark);
      sheet.appendChild(borderL);
      sheet.appendChild(borderR);
      sheet.appendChild(content);
      sheet.appendChild(footer);

      return { sheet, content };
    }

    // ✅ هر بخش را به h2 + چند p خرد می‌کنیم تا صفحه‌بندی دقیق شود
    function makeSectionNodes(title, text) {
      const nodes = [];
      const h2 = document.createElement("div");
      h2.className = "h2";
      h2.textContent = title;
      nodes.push(h2);

      const raw = (text || "").trim();
      if (!raw) return nodes;

      const paras = raw
        .split(/\\n{2,}/g)
        .map(p => p.replace(/\\s+/g, " ").trim())
        .filter(Boolean);

      for (const ptxt of paras) {
        const p = document.createElement("div");
        p.className = "p";
        p.textContent = ptxt;
        nodes.push(p);
      }
      return nodes;
    }

    function buildNodes() {
      const nodes = [];

      const header = document.createElement("div");
      header.className = "header";
      header.innerHTML = \`
        <h1>${title}</h1>
        <div class="meta">
          <div>${isFa ? "نویسنده: " : "Author: "}${author}</div>
          <div>${isFa ? "تاریخ: " : "Date: "}${date}</div>
        </div>
      \`;
      nodes.push(header);

      nodes.push(...makeSectionNodes("${isFa ? "۱. مقدمه" : "1. Introduction"}", ${JSON.stringify(intro)}));
      nodes.push(...makeSectionNodes("${isFa ? "۲. بدنه و تحلیل" : "2. Body & Analysis"}", ${JSON.stringify(body)}));
      nodes.push(...makeSectionNodes("${isFa ? "۳. نتیجه‌گیری" : "3. Conclusion"}", ${JSON.stringify(conclusion)}));

      // references (حالت br)
      const refTitle = document.createElement("div");
      refTitle.className = "h2";
      refTitle.textContent = "${isFa ? "۴. منابع" : "4. References"}";
      nodes.push(refTitle);

      const ref = document.createElement("div");
      ref.className = "p";
      ref.innerHTML = ${JSON.stringify(references)}.replace(/\\n+/g, "<br/>");
      nodes.push(ref);

      return nodes;
    }

    function isEmpty(el) {
      const t = (el.innerText || "").replace(/\\s+/g, " ").trim();
      return t.length === 0 && el.childElementCount === 0;
    }

    function removeEmptySheets(pagesEl) {
      const sheets = Array.from(pagesEl.querySelectorAll(".sheet"));
      for (const sh of sheets) {
        const c = sh.querySelector(".content");
        if (!c || isEmpty(c)) sh.remove();
      }
    }

    function renumber(pagesEl) {
      const sheets = Array.from(pagesEl.querySelectorAll(".sheet"));
      sheets.forEach((sh, i) => {
        const pno = sh.querySelector(".pno");
        if (pno) pno.textContent = String(i + 1);
      });
    }

    function paginate(nodes) {
      const pages = document.getElementById("pages");
      pages.innerHTML = "";

      let sheetObj = null;
      const newPage = () => {
        sheetObj = createSheet();
        pages.appendChild(sheetObj.sheet);
      };

      for (const node of nodes) {
        if (!sheetObj) newPage();

        sheetObj.content.appendChild(node);

        // ✅ معیار overflow دقیق
        if (sheetObj.content.scrollHeight > sheetObj.content.clientHeight) {
          sheetObj.content.removeChild(node);
          newPage();
          sheetObj.content.appendChild(node);
        }
      }

      removeEmptySheets(pages);
      renumber(pages);
    }

    async function start() {
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch {}
      const nodes = buildNodes();

      // ✅ یکبار صفحه‌بندی
      paginate(nodes);

      // ✅ مهم: چون فونت و layout ممکنه بعد از چند ms settle بشه، دوباره paginate
      setTimeout(() => {
        const nodes2 = buildNodes();
        paginate(nodes2);

        setTimeout(() => {
          window.focus();
          window.print();
        }, 250);
      }, 250);
    }

    window.onload = start;
  </script>
</body>
</html>`;

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}










// --- helpers ---
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toParagraphs(text) {
  const t = String(text ?? "").trim();
  if (!t) return "—";
  const blocks = t.split(/\n\s*\n+/g).map((s) => s.trim()).filter(Boolean);
  return blocks.map((b) => escapeHtml(b).replaceAll("\n", "<br/>")).join("</p><p>");
}

// استخراج ساده کلیدواژه وقتی keywords خالیه
function extractKeywordsFallback(text, topK = 8) {
  const t = String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s‌-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!t) return [];

  const stop = new Set(["و","یا","که","این","آن","را","در","به","از","با","برای","است","می","شود","شد","هست","بود","های"]);
  const tokens = t.split(" ").filter(Boolean).filter((x) => x.length >= 3 && !stop.has(x) && !/^\d+$/.test(x));

  const freq = new Map();
  for (const tok of tokens) freq.set(tok, (freq.get(tok) || 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([k]) => k);
}
