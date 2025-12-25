// src/utils/pdfText.js
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function normalizeFa(s) {
  return (s || "")
    .replace(/\u200c/g, "‌")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function groupItemsByLine(items, baseTolerance = 3.2) {
  const lines = [];

  for (const it of items) {
    const raw = it.str ?? "";
    const str = normalizeFa(raw);
    if (!str) continue;

    const x = it.transform?.[4] ?? 0;
    const y = it.transform?.[5] ?? 0;

    const fontH = Math.abs(it.transform?.[3] ?? 0) || 0;
    const tol = Math.max(baseTolerance, Math.min(8, fontH * 0.35));

    let line = null;
    for (const l of lines) {
      if (Math.abs(l.y - y) <= tol) {
        line = l;
        break;
      }
    }

    if (!line) {
      line = { y, items: [] };
      lines.push(line);
    }

    line.items.push({
      str,
      x,
      width: it.width ?? 0,
    });
  }

  return lines;
}

function joinLineItemsWithSpacing(items, rtl = true) {
  if (!items.length) return "";

  items.sort((a, b) => (rtl ? b.x - a.x : a.x - b.x));

  const widths = items
    .map((i) => (i.width && i.str ? i.width / Math.max(1, i.str.length) : 0))
    .filter((v) => v > 0);

  const avgCharW =
    widths.length > 0
      ? widths.reduce((a, b) => a + b, 0) / widths.length
      : 4;

  let out = items[0].str;

  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const cur = items[i];

    const prevLeftEdge = prev.x - (prev.width || 0);
    const curRightEdge = cur.x;
    const gap = prevLeftEdge - curRightEdge;

    if (gap > avgCharW * 0.75) out += " ";
    out += cur.str;
  }

  return normalizeFa(out);
}

function buildText(lines, rtl = true) {
  lines.sort((a, b) => b.y - a.y);

  const pageLines = lines
    .map((line) => joinLineItemsWithSpacing(line.items, rtl))
    .map((s) => s.trim())
    .filter(Boolean);

  return pageLines.join("\n");
}

/**
 * ✅ Main extractor with fallback
 */
export async function extractPdfTextFromUrl(url, opts = {}) {
  const { rtl = true, maxPages } = opts;

  const res = await fetch(url);
  if (!res.ok) throw new Error("PDF fetch failed");

  const buffer = await res.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const total = pdf.numPages;
  const limit = typeof maxPages === "number" ? Math.min(total, maxPages) : total;

  const pages = [];

  for (let p = 1; p <= limit; p++) {
    const page = await pdf.getPage(p);

    const content = await page.getTextContent({
      normalizeWhitespace: true,
      disableCombineTextItems: false,
    });

    // 1) روش دقیق (خطی)
    const lines = groupItemsByLine(content.items, 3.2);
    let pageText = buildText(lines, rtl);

    // ✅ 2) fallback: اگر خالی شد، join ساده‌ی str ها
    if (!pageText || !pageText.trim()) {
      const simple = (content.items || [])
        .map((it) => normalizeFa(it.str || ""))
        .filter(Boolean)
        .join(" ");

      pageText = normalizeFa(simple);
    }

    if (pageText && pageText.trim()) pages.push(pageText.trim());
  }

  return pages.join("\n\n");
}
