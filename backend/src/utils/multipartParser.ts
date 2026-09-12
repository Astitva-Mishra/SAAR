import { Request } from 'express';

export interface ParsedFile {
  fieldName: string;
  filename: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface MultipartParseResult {
  fields: Record<string, string>;
  files: ParsedFile[];
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file

/**
 * Validates file extension against allowed whitelist
 */
export function isValidExtension(filename: string): boolean {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return false;
  const ext = filename.slice(dotIndex).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Validates file MIME type against allowed whitelist
 */
export function isValidMimeType(mimeType: string): boolean {
  const lower = mimeType.toLowerCase();
  return ALLOWED_MIME_TYPES.includes(lower);
}

/**
 * Pure Node.js streaming multipart/form-data parser.
 * Requires 0 external npm dependencies and handles RFC 7578 multipart format.
 */
export async function parseMultipartRequest(
  req: Request,
  maxSizeBytes = MAX_FILE_SIZE_BYTES
): Promise<MultipartParseResult> {
  const contentType = req.headers['content-type'] || '';

  // Also support JSON base64 payloads if passed
  if (contentType.includes('application/json')) {
    const { filename, mimeType, base64, ...fields } = req.body || {};
    const files: ParsedFile[] = [];
    if (filename && base64) {
      const buffer = Buffer.from(base64, 'base64');
      if (buffer.length > maxSizeBytes) {
        throw new Error(`File size ${Math.round(buffer.length / (1024 * 1024))}MB exceeds maximum limit of 10MB.`);
      }
      files.push({
        fieldName: 'file',
        filename: String(filename),
        mimeType: String(mimeType || 'application/octet-stream'),
        size: buffer.length,
        buffer,
      });
    }
    return { fields: fields as Record<string, string>, files };
  }

  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Invalid content type. Expected multipart/form-data.');
  }

  const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
  if (!boundaryMatch) {
    throw new Error('Missing multipart boundary in Content-Type header.');
  }

  let boundary = boundaryMatch[1].trim();
  // Strip quotes if present
  if (boundary.startsWith('"') && boundary.endsWith('"')) {
    boundary = boundary.slice(1, -1);
  }

  // Read request body stream into Buffer with a total limit
  const maxTotalBytes = maxSizeBytes + 2 * 1024 * 1024; // +2MB headroom for headers
  const chunks: Buffer[] = [];
  let totalRead = 0;

  // If Express has already read the body as a buffer
  if (Buffer.isBuffer(req.body)) {
    chunks.push(req.body);
    totalRead = req.body.length;
  } else {
    for await (const chunk of req) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalRead += buf.length;
      if (totalRead > maxTotalBytes) {
        throw new Error('Upload payload exceeds maximum allowable size limit of 10MB.');
      }
      chunks.push(buf);
    }
  }

  const rawBuffer = Buffer.concat(chunks);
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const crlf2 = Buffer.from('\r\n\r\n');

  const fields: Record<string, string> = {};
  const files: ParsedFile[] = [];

  let start = rawBuffer.indexOf(boundaryBuf);

  while (start !== -1) {
    start += boundaryBuf.length;

    // Check if end boundary (--boundary--)
    if (rawBuffer.subarray(start, start + 2).toString('ascii') === '--') {
      break;
    }

    // Skip leading CRLF
    if (rawBuffer.subarray(start, start + 2).toString('ascii') === '\r\n') {
      start += 2;
    }

    const nextBoundary = rawBuffer.indexOf(boundaryBuf, start);
    if (nextBoundary === -1) break;

    // The part data (excluding trailing \r\n before next boundary)
    const partData = rawBuffer.subarray(start, nextBoundary - 2);
    const headerEnd = partData.indexOf(crlf2);

    if (headerEnd !== -1) {
      const headerText = partData.subarray(0, headerEnd).toString('utf8');
      const bodyBuffer = partData.subarray(headerEnd + 4);

      // Parse Content-Disposition
      const dispositionMatch = headerText.match(/content-disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);

      if (dispositionMatch) {
        const fieldName = dispositionMatch[1];
        const filename = dispositionMatch[2];

        if (filename !== undefined) {
          // File part
          const typeMatch = headerText.match(/content-type:\s*([^\r\n;]+)/i);
          const mimeType = typeMatch ? typeMatch[1].trim() : 'application/octet-stream';

          if (bodyBuffer.length > maxSizeBytes) {
            throw new Error(`File "${filename}" (${Math.round(bodyBuffer.length / (1024 * 1024))}MB) exceeds maximum limit of 10MB.`);
          }

          files.push({
            fieldName,
            filename,
            mimeType,
            size: bodyBuffer.length,
            buffer: bodyBuffer,
          });
        } else {
          // Regular text field
          fields[fieldName] = bodyBuffer.toString('utf8');
        }
      }
    }

    start = nextBoundary;
  }

  return { fields, files };
}
