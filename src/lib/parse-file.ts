// Client-side file parsing for resume uploads.
// Supports .txt, .pdf, and .docx.

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || file.type === "text/plain") {
    return await file.text();
  }

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return await extractPdf(file);
  }

  if (
    name.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return await extractDocx(file);
  }

  throw new Error(
    "Unsupported file type. Please upload a .txt, .pdf, or .docx file.",
  );
}

async function extractPdf(file: File): Promise<string> {
  // Dynamic import so pdfjs only loads in the browser when needed.
  const pdfjs = await import("pdfjs-dist");
  // Load the worker from a CDN so it works in production builds without bundler-specific URL imports.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it: unknown) => (it as { str?: string }).str ?? "")
      .join(" ");
    parts.push(text);
  }
  return parts.join("\n\n").trim();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value.trim();
}