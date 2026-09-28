// Browser-only: pull the text out of a PDF so it can be sent to the AI (Groq
// reads text, not PDFs). pdf.js is loaded on demand, only on the import page.

export async function pdfPageCount(file: File): Promise<number> {
  const doc = await openPdf(file);
  const n = doc.numPages;
  await doc.destroy();
  return n;
}

export async function extractPdfText(
  file: File,
  fromPage: number,
  toPage: number,
  onProgress?: (done: number, total: number) => void,
): Promise<string> {
  const doc = await openPdf(file);
  try {
    const first = Math.max(1, fromPage);
    const last = Math.min(doc.numPages, toPage);
    const parts: string[] = [];
    for (let p = first; p <= last; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      let text = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        text += item.str;
        text += item.hasEOL ? "\n" : " ";
      }
      parts.push(
        `--- Page ${p} ---\n${text
          .replace(/[ \t]+\n/g, "\n")
          .replace(/ {2,}/g, " ")
          .trim()}`,
      );
      page.cleanup();
      onProgress?.(p - first + 1, last - first + 1);
    }
    return parts.join("\n\n");
  } finally {
    await doc.destroy();
  }
}

async function openPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({ data, isEvalSupported: false }).promise;
}
