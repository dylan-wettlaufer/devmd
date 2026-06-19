import { Buffer } from "node:buffer";
import path from "node:path";
import { pathToFileURL } from "node:url";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const maxResumeFileBytes = 5 * 1024 * 1024;
const pdfWorkerUrl = pathToFileURL(
  path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
).href;

const textFileExtensions = new Set([".md", ".txt"]);

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  return lastDotIndex === -1 ? "" : fileName.slice(lastDotIndex).toLowerCase();
}

function normalizeExtractedText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractPdfText(buffer: Buffer) {
  PDFParse.setWorker(pdfWorkerUrl);

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function extractWordText(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });

  return result.value;
}

export async function parseResumeFile(file: File) {
  if (file.size > maxResumeFileBytes) {
    throw new Error("Resume files must be 5 MB or smaller.");
  }

  const extension = getFileExtension(file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  let extractedText = "";

  if (extension === ".pdf") {
    extractedText = await extractPdfText(buffer);
  } else if (extension === ".docx") {
    extractedText = await extractWordText(buffer);
  } else if (textFileExtensions.has(extension)) {
    extractedText = buffer.toString("utf8");
  } else {
    throw new Error("Upload a PDF, DOCX, TXT, or Markdown resume.");
  }

  const normalizedText = normalizeExtractedText(extractedText);

  if (normalizedText.length < 50) {
    throw new Error("The uploaded resume did not contain enough readable text.");
  }

  return normalizedText;
}
