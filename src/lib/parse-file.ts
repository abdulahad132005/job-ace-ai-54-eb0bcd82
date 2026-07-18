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
  // Use the bundled worker via a URL import.
  // @ts-expect-error - worker import handled by Vite as URL
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
    .default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

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