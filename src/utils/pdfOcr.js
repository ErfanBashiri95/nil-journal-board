import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import Tesseract from "tesseract.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// OCR فقط برای PDF اسکن‌شده
export async function extractPdfTextWithOcr(url, lang = "fas") {
  const res = await fetch(url);
  if (!res.ok) throw new Error("PDF fetch failed");

  const buffer = await res.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let fullText = "";

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const canvas = document.createElement("canvas");
    const viewport = page.getViewport({ scale: 2 });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;

    const {
      data: { text },
    } = await Tesseract.recognize(canvas, lang);

    if (text?.trim()) {
      fullText += text.trim() + "\n\n";
    }
  }

  return fullText.trim();
}
