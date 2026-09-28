// Browser-only PDF helpers for the AI import, loaded on demand:
// - extractPdfText: the text layer (pdf.js), used to check the AI's quotes and
//   for an AI that reads text only.
// - openPdfSplitter: small PDFs of a few pages each (pdf-lib), for an AI that
//   reads PDFs directly (tables and scanned pages).

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

// Keep each request well under the AI's inline-file limit (~20 MB after base64).
const MAX_PART_BYTES = 12 * 1024 * 1024;

export async function openPdfSplitter(file: File) {
  const { PDFDocument } = await import("pdf-lib");
  let source: Awaited<ReturnType<typeof PDFDocument.load>> | null = null;
  try {
    source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  } catch {
    source = null; // unreadable by pdf-lib: fall back to text only
  }
  return {
    /** Pages `from`..`to` (1-based) as a base64 PDF, or null if it can't be made small enough. */
    async pages(from: number, to: number): Promise<string | null> {
      if (!source) return null;
      try {
        const part = await PDFDocument.create();
        const indices = Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
        const copied = await part.copyPages(source, indices);
        copied.forEach((page) => part.addPage(page));
        const bytes = await part.save({ useObjectStreams: true });
        return bytes.byteLength > MAX_PART_BYTES ? null : toBase64(bytes);
      } catch {
        return null;
      }
    },
  };
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
