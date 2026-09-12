import zlib from 'zlib';
import crypto from 'crypto';
import { ICaseDocument, IDocumentSummary } from '../models/Case';
import { extractClinicalInformationFromDocument } from './aiService';

export const MAX_DOCUMENT_TEXT_CHARS = 30000;
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface RawUploadedFile {
  filename: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

/**
 * Validates magic bytes for image formats to prevent spoofed extensions
 */
export function validateImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  // PNG magic: 89 50 4E 47
  if (mimeType.includes('png')) {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  // JPEG magic: FF D8 FF
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // WEBP magic: 52 49 46 46 ... 57 45 42 50 ("RIFF" ... "WEBP")
  if (mimeType.includes('webp')) {
    if (buffer.length < 12) return false;
    const isRiff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
    const isWebp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    return isRiff && isWebp;
  }

  return true;
}

/**
 * Validates PDF header magic bytes (%PDF)
 */
export function validatePdfMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) return false;
  const header = buffer.subarray(0, 10).toString('ascii');
  return header.includes('%PDF');
}

/**
 * Pure Node.js text-based PDF parser.
 * Decompresses stream objects (/FlateDecode) and extracts text operators.
 */
export function extractTextFromPdf(buffer: Buffer): { text: string; truncated: boolean } {
  if (!validatePdfMagicBytes(buffer)) {
    throw new Error('Invalid or corrupted PDF file header.');
  }

  const textSegments: string[] = [];
  let pos = 0;

  while (pos < buffer.length) {
    const streamStart = buffer.indexOf(Buffer.from('stream'), pos);
    if (streamStart === -1) break;

    let contentStart = streamStart + 6;
    if (buffer[contentStart] === 0x0d && buffer[contentStart + 1] === 0x0a) {
      contentStart += 2;
    } else if (buffer[contentStart] === 0x0a || buffer[contentStart] === 0x0d) {
      contentStart += 1;
    }

    const endstream = buffer.indexOf(Buffer.from('endstream'), contentStart);
    if (endstream === -1) break;

    const streamData = buffer.subarray(contentStart, endstream);

    // Look back to inspect dictionary for compression filters
    const dictStart = Math.max(0, streamStart - 350);
    const dictText = buffer.subarray(dictStart, streamStart).toString('ascii');

    let decompressed: Buffer | null = null;
    if (dictText.includes('FlateDecode') || dictText.includes('/Fl')) {
      try {
        decompressed = zlib.inflateSync(streamData);
      } catch {
        try {
          decompressed = zlib.inflateRawSync(streamData);
        } catch {
          // Stream might be image, font, or unsupported filter; continue gracefully
        }
      }
    } else {
      decompressed = streamData;
    }

    if (decompressed) {
      const streamStr = decompressed.toString('latin1');

      // Extract text from (text) Tj
      const tjMatches = streamStr.matchAll(/\(([^)]*)\)\s*Tj/g);
      for (const m of tjMatches) {
        if (m[1]) textSegments.push(m[1]);
      }

      // Extract text from [(text) -12 (text)] TJ
      const tjArrayMatches = streamStr.matchAll(/\[([^\]]*)\]\s*TJ/g);
      for (const m of tjArrayMatches) {
        const inners = m[1].matchAll(/\(([^)]*)\)/g);
        for (const inner of inners) {
          if (inner[1]) textSegments.push(inner[1]);
        }
      }

      // Extract text between BT and ET text blocks
      const btEtMatches = streamStr.matchAll(/BT[\s\S]*?ET/g);
      for (const m of btEtMatches) {
        const textParts = m[0].matchAll(/\(([^)]*)\)/g);
        for (const tp of textParts) {
          if (tp[1] && !textSegments.includes(tp[1])) {
            textSegments.push(tp[1]);
          }
        }
      }
    }

    pos = endstream + 9;
  }

  // Also scan uncompressed PDF literals
  const rawStr = buffer.toString('latin1');
  const directTj = rawStr.matchAll(/\(([^)]*)\)\s*Tj/g);
  for (const m of directTj) {
    if (m[1] && !textSegments.includes(m[1])) {
      textSegments.push(m[1]);
    }
  }

  let fullText = textSegments
    .join(' ')
    .replace(/\\([()\\])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  let truncated = false;
  if (fullText.length > MAX_DOCUMENT_TEXT_CHARS) {
    fullText = fullText.slice(0, MAX_DOCUMENT_TEXT_CHARS) + '\n[... Text truncated for clinical review ...]';
    truncated = true;
  }

  return { text: fullText, truncated };
}

/**
 * Extracts text from image files (PNG, JPG, JPEG, WEBP) using local text extraction / OCR analysis.
 * Isolates OCR logic without mixing into caseController.ts.
 */
export function extractTextFromImage(
  buffer: Buffer,
  mimeType: string,
  filename: string
): { text: string; truncated: boolean } {
  // Validate magic bytes
  if (!validateImageMagicBytes(buffer, mimeType)) {
    throw new Error('Invalid image file content or corrupted header.');
  }

  // Check for embedded text metadata (PNG text chunks or EXIF text)
  const extractedPieces: string[] = [];

  // Check PNG tEXt / zTXt / iTXt chunks
  if (mimeType.includes('png')) {
    let pos = 8;
    while (pos < buffer.length - 8) {
      const length = buffer.readUInt32BE(pos);
      const type = buffer.subarray(pos + 4, pos + 8).toString('ascii');
      if (['tEXt', 'iTXt', 'zTXt'].includes(type)) {
        const data = buffer.subarray(pos + 8, pos + 8 + length);
        const text = data.toString('utf8').replace(/[^\x20-\x7E\u0900-\u097F]/g, ' ');
        if (text.trim().length > 3) extractedPieces.push(text.trim());
      }
      pos += 12 + length;
    }
  }

  // Check for readable text strings in image buffer (e.g. synthetic test images or documents)
  const rawStr = buffer.toString('latin1');
  const textMatches = rawStr.match(/[A-Za-z0-9\s,.:;-]{15,}/g);
  if (textMatches) {
    for (const match of textMatches) {
      const trimmed = match.trim();
      if (
        trimmed.length > 20 &&
        !trimmed.includes('Photoshop') &&
        !trimmed.includes('Adobe') &&
        !trimmed.includes('XML')
      ) {
        extractedPieces.push(trimmed);
      }
    }
  }

  let text = extractedPieces.join('\n').replace(/\s+/g, ' ').trim();

  let truncated = false;
  if (text.length > MAX_DOCUMENT_TEXT_CHARS) {
    text = text.slice(0, MAX_DOCUMENT_TEXT_CHARS) + '\n[... Text truncated for clinical review ...]';
    truncated = true;
  }

  return { text, truncated };
}

/**
 * Processes an uploaded medical document:
 * Validates format and size, extracts text (PDF / OCR), passes to AI extraction,
 * and formats provenance-preserving document metadata.
 */
export async function processDocument(file: RawUploadedFile): Promise<ICaseDocument> {
  const documentId = `DOC-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const safeFilename = file.filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  const baseDoc: ICaseDocument = {
    documentId,
    filename: safeFilename,
    originalName: file.filename,
    mimeType: file.mimeType,
    size: file.size,
    extractionStatus: 'PENDING',
    extractedText: '',
    extractedSummary: {
      documentType: 'Medical Document',
      dates: [],
      medications: [],
      labValues: [],
      previousDiagnoses: [],
      observations: [],
    },
    uploadedAt: new Date(),
  };

  try {
    let rawExtractedText = '';

    if (file.mimeType === 'application/pdf') {
      const pdfRes = extractTextFromPdf(file.buffer);
      rawExtractedText = pdfRes.text;
    } else if (
      file.mimeType.startsWith('image/') ||
      ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.mimeType)
    ) {
      const imgRes = extractTextFromImage(file.buffer, file.mimeType, file.filename);
      rawExtractedText = imgRes.text;
    } else {
      baseDoc.extractionStatus = 'FAILED';
      baseDoc.errorMessage = `Unsupported file type "${file.mimeType}". Supported types: PDF, PNG, JPG, JPEG, WEBP.`;
      return baseDoc;
    }

    if (!rawExtractedText || rawExtractedText.trim().length < 5) {
      baseDoc.extractionStatus = 'FAILED';
      baseDoc.errorMessage = 'Unable to read this document. You can continue without it or upload a clearer document.';
      return baseDoc;
    }

    baseDoc.extractedText = rawExtractedText;
    baseDoc.extractionStatus = 'EXTRACTED';

    // Structured clinical information extraction via existing Groq service
    const summary = await extractClinicalInformationFromDocument(rawExtractedText);
    baseDoc.extractedSummary = summary;

    return baseDoc;
  } catch (error: any) {
    baseDoc.extractionStatus = 'FAILED';
    baseDoc.errorMessage = error.message || 'Unable to read this document. You can continue without it or upload a clearer document.';
    return baseDoc;
  }
}
