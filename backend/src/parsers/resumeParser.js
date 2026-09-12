/**
 * High-Performance Resume File Parser
 * 
 * 1. Instant local parsing (<50ms):
 *    - PDF: Extracted directly via pdf-parse
 *    - DOCX / DOC: Extracted directly via mammoth
 *    - TXT: Direct UTF-8 buffer decoding
 * 2. Remote OCR fallback (Unstract LLMWhisperer):
 *    - Triggered ONLY for scanned image-only documents where local text < 30 chars
 * 3. Resilient heuristic fallback:
 *    - Regex printable ASCII / UTF-8 extraction if all else fails
 */
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import config from "../config.js";

const API_KEY = config.unstractApiKey;
const BASE_URL = "https://llmwhisperer-api.us-central.unstract.com/api/v2";

/**
 * Fast local PDF extraction via pdf-parse
 */
async function parseLocalPdf(buffer) {
  let parser = null;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return (result?.text || "").trim();
  } catch (err) {
    console.warn(`[parser] Local PDF parse warning: ${err.message}`);
    return "";
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (_) {}
    }
  }
}

/**
 * Fast local DOCX / DOC extraction via mammoth
 */
async function parseLocalDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return (result?.value || "").trim();
  } catch (err) {
    console.warn(`[parser] Local DOCX parse warning: ${err.message}`);
    return "";
  }
}

/**
 * Resilient ASCII/UTF-8 fallback extractor for raw binary streams
 */
function extractFallbackText(buffer) {
  try {
    const str = buffer.toString("latin1");
    const matches = str.match(/[\x20-\x7E\t\n\r]{4,}/g);
    if (matches && matches.length > 0) {
      return matches.join(" ").replace(/\s+/g, " ").trim();
    }
  } catch (e) {
    console.warn("[parser] Fallback extraction failed:", e.message);
  }
  return buffer.toString("utf-8").trim();
}

/**
 * Remote OCR fallback using Unstract LLMWhisperer API (only for scanned images)
 */
async function extractRemoteOcr(filename, buffer) {
  if (!API_KEY || API_KEY.includes("your_unstract_api_key")) {
    return null;
  }

  console.log(`[parser] Local text was sparse. Submitting ${filename} to Unstract OCR API...`);
  try {
    const submitRes = await fetch(
      `${BASE_URL}/whisper?processing_mode=sync&output_mode=layout_preserving&mode=high_quality`,
      {
        method: "POST",
        headers: {
          "unstract-key": API_KEY,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      }
    );

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.warn(`[parser] Unstract submission failed (${submitRes.status}): ${errText}`);
      return null;
    }

    const data = await submitRes.json();
    const syncText = data.result_text || data.extraction?.result_text || data.extracted_text;
    if (syncText) {
      return syncText.trim();
    }

    const hash = data.whisper_hash;
    if (!hash) return null;

    // Poll for status (max 15 attempts / 30s)
    let attempts = 0;
    while (attempts < 15) {
      await new Promise((r) => setTimeout(r, 2000));
      attempts++;

      const statusRes = await fetch(`${BASE_URL}/whisper-status?whisper_hash=${hash}`, {
        headers: { "unstract-key": API_KEY },
      });

      if (!statusRes.ok) continue;
      const statusData = await statusRes.json();

      if (statusData.status === "processed") {
        const retRes = await fetch(`${BASE_URL}/whisper-retrieve?whisper_hash=${hash}`, {
          headers: { "unstract-key": API_KEY },
        });
        const retData = await retRes.json();
        return (retData.result_text || retData.extracted_text || retData.extraction?.result_text || "").trim();
      } else if (statusData.status === "failed" || statusData.status === "error") {
        break;
      }
    }
  } catch (err) {
    console.warn(`[parser] Remote OCR error: ${err.message}`);
  }
  return null;
}

/**
 * Extract text from resume buffer with maximum speed (<50ms for digital docs)
 * @param {string} filename 
 * @param {Buffer} buffer 
 * @returns {Promise<string>} extracted text
 */
export async function extractText(filename, buffer) {
  const startTime = Date.now();
  const ext = path.extname(filename).toLowerCase();
  
  // 1. Plain text (.txt)
  if (ext === ".txt") {
    const text = buffer.toString("utf-8").trim();
    console.log(`[parser] TXT parsed in ${Date.now() - startTime}ms (${text.length} chars)`);
    return text;
  }

  // 2. PDF (.pdf) — Fast local parse
  if (ext === ".pdf") {
    const text = await parseLocalPdf(buffer);
    if (text && text.length >= 30) {
      console.log(`[parser] Fast local PDF parsed in ${Date.now() - startTime}ms (${text.length} chars)`);
      return text;
    }
  }

  // 3. Word (.docx, .doc) — Fast local parse
  if (ext === ".docx" || ext === ".doc") {
    const text = await parseLocalDocx(buffer);
    if (text && text.length >= 30) {
      console.log(`[parser] Fast local DOCX parsed in ${Date.now() - startTime}ms (${text.length} chars)`);
      return text;
    }
  }

  // 4. If text is sparse (scanned image / OCR needed), try remote OCR
  const ocrText = await extractRemoteOcr(filename, buffer);
  if (ocrText && ocrText.length >= 30) {
    console.log(`[parser] Remote OCR parsed in ${Date.now() - startTime}ms (${ocrText.length} chars)`);
    return ocrText;
  }

  // 5. Resilient binary/ASCII fallback
  const fallbackText = extractFallbackText(buffer);
  console.log(`[parser] Fallback extraction used in ${Date.now() - startTime}ms (${fallbackText.length} chars)`);
  return fallbackText;
}
