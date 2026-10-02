import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { createWorker, type Worker } from "tesseract.js";

export interface OcrResult {
  panNumber: string | null;
  name: string | null;
  dateOfBirth: string | null;
  confidence: number;
}

type OcrWord = {
  text: string;
  confidence?: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
};

const tempDir = path.join(process.cwd(), "private", "ocr");

const tempFile = (prefix: string) => {
  fs.mkdirSync(tempDir, { recursive: true });
  return path.join(
    tempDir,
    `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.png`
  );
};

const removeFile = async (file: string) => {
  try {
    await fs.promises.unlink(file);
  } catch {}
};

// Tesseract.js v6: words are nested inside blocks -> paragraphs -> lines -> words.
// Older versions (v5 and below) expose data.words directly, so both are supported.
const getWords = (data: any): OcrWord[] => {
  if (Array.isArray(data?.words) && data.words.length) return data.words;

  const blocks = Array.isArray(data?.blocks) ? data.blocks : [];
  return blocks.flatMap((block: any) =>
    (block.paragraphs ?? []).flatMap((paragraph: any) =>
      (paragraph.lines ?? []).flatMap((line: any) => line.words ?? [])
    )
  );
};

// blocks: true is required in v6, otherwise word-level data is not returned.
const recognize = (worker: Worker, file: string) =>
  worker.recognize(file, {}, { blocks: true, text: true });

const cleanText = (text: string) =>
  text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").trim();

const cleanName = (text: string) =>
  text
    .replace(/[^A-Za-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const ignoredNames = new Set([
  "INCOME", "TAX", "DEPARTMENT", "GOVT", "GOVERNMENT", "INDIA",
  "PERMANENT", "ACCOUNT", "NUMBER", "CARD", "DATE", "BIRTH", "DOB",
  "FATHER", "FATHERS", "NAME", "SIGNATURE", "SPECIMEN", "PAN",
  "ADDRESS", "AADHAAR", "DOCUMENT", "DEMO"
]);

const validName = (value: string) => {
  const words = value.split(" ");
  return (
    words.length >= 1 &&
    words.length <= 4 &&
    words.every(
      (word) => /^[A-Z]{2,30}$/.test(word) && !ignoredNames.has(word)
    )
  );
};

const extractName = (text: string): string | null => {
  const lines = cleanText(text)
    .split("\n")
    .map(cleanName)
    .filter(Boolean);

  // Strong priority: text immediately after the "Name" label.
  const index = lines.findIndex(
    (line) =>
      /\bNAME\b/.test(line) && !/\bFATHER(?:S)?\s+NAME\b/.test(line)
  );

  if (index >= 0) {
    const candidates: string[] = [];

    for (let i = index + 1; i <= Math.min(index + 3, lines.length - 1); i++) {
      const words = lines[i].split(" ");

      for (let size = Math.min(3, words.length); size >= 1; size--) {
        for (let start = 0; start + size <= words.length; start++) {
          const candidate = words.slice(start, start + size).join(" ");
          if (validName(candidate)) candidates.push(candidate);
        }
      }
    }

    if (candidates.length) {
      return candidates.sort((a, b) => {
        const score = (v: string) =>
          v
            .split(" ")
            .reduce(
              (sum, word) =>
                sum + (word.length >= 8 ? 30 : word.length >= 5 ? 10 : 0),
              0
            );
        return score(b) - score(a);
      })[0];
    }
  }

  // Fallback: choose the longest valid name-like line.
  const candidates = lines.filter(validName);
  return candidates.length
    ? candidates.sort((a, b) => {
        const score = (v: string) => {
          const words = v.split(" ");
          let value = Math.max(...words.map((w) => w.length));
          if (words.length > 1 && words.some((w) => w.length <= 3)) value -= 20;
          return value;
        };
        return score(b) - score(a);
      })[0]
    : null;
};

const extractPanNumber = (text: string): string | null => {
  const normalized = text.toUpperCase().replace(/\s+/g, " ");

  const direct = normalized.match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/);
  if (direct) return direct[0];

  const spaced = normalized.match(/\b([A-Z]{5})\s*([0-9]{4})\s*([A-Z])\b/);
  return spaced ? `${spaced[1]}${spaced[2]}${spaced[3]}` : null;
};

// The 5th character of a PAN is the first letter of the surname.
// Trailing short tokens after the last word starting with that letter are OCR noise.
const refineName = (name: string | null, pan: string | null) => {
  if (!name || !pan || pan.length < 5) return name;

  const initial = pan[4];
  const words = name.split(" ");

  let last = -1;
  words.forEach((word, i) => {
    if (word.startsWith(initial)) last = i;
  });

  if (last >= 0 && last < words.length - 1) {
    const trailing = words.slice(last + 1);
    if (trailing.every((word) => word.length <= 4)) {
      return words.slice(0, last + 1).join(" ");
    }
  }

  return name;
};

const validateDate = (day: string, month: string, year: string) => {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) {
    return null;
  }
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;

  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }

  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
};

const extractDate = (text: string): string | null => {
  const normalized = text
    .replace(/[OoQ]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/\s+/g, " ");

  const regex =
    /(?:^|[^0-9A-Za-z])(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*((?:19|20)\d{2})(?!\d)/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(normalized))) {
    const date = validateDate(match[1], match[2], match[3]);
    if (date) return date;
  }

  return null;
};

const preprocessFull = async (input: string) => {
  const output = tempFile("full");
  await sharp(input)
    .resize({ width: 3000, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toFile(output);
  return output;
};

const isDobLabel = (rawText: string) => {
  const value = (rawText || "").toUpperCase().replace(/[^A-Z]/g, "");

  return (
    value === "DATE" ||
    value === "BIRTH" ||
    value === "DOB" ||
    value === "DATEOFBIRTH" ||
    value.includes("BIRTH") ||
    value.startsWith("DATEOF") ||
    (value.includes("DAE") && value.includes("BI"))
  );
};

const findDobRegion = async (worker: Worker, input: string) => {
  // Tiny images cause Tesseract errors, so upscale before detecting the label.
  const scaled = tempFile("dob-label");
  await sharp(input)
    .resize({ width: 3000, withoutEnlargement: false })
    .sharpen()
    .png()
    .toFile(scaled);

  let keepScaled = false;

  try {
    const meta = await sharp(scaled).metadata();
    const imageWidth = meta.width ?? 0;
    const imageHeight = meta.height ?? 0;
    if (!imageWidth || !imageHeight) return null;

    const result = await recognize(worker, scaled);
    const words = getWords(result.data);
    if (!words.length) return null;

    const labels = words.filter((word) => isDobLabel(word.text));
    console.log(
      "🏷️ DOB label candidates:",
      labels.map((w) => ({ text: w.text, bbox: w.bbox }))
    );

    const boxes = labels.filter((w) => w.bbox).map((w) => w.bbox!);
    if (!boxes.length) return null;

    const left = Math.min(...boxes.map((b) => b.x0));
    const right = Math.max(...boxes.map((b) => b.x1));
    const bottom = Math.max(...boxes.map((b) => b.y1));

    const padX = Math.max(80, Math.round(imageWidth * 0.08));
    const top = Math.min(imageHeight - 1, Math.round(bottom));
    const regionLeft = Math.max(0, Math.round(left - padX));
    const regionRight = Math.min(imageWidth, Math.round(right + padX));
    const regionHeight = Math.max(250, Math.round(imageHeight * 0.38));
    const regionBottom = Math.min(imageHeight, top + regionHeight);

    if (regionRight <= regionLeft || regionBottom <= top) return null;

    keepScaled = true;
    return {
      imagePath: scaled,
      region: {
        left: regionLeft,
        top,
        width: regionRight - regionLeft,
        height: regionBottom - top
      }
    };
  } finally {
    // Remove the scaled file on every path except the successful one,
    // where the caller owns it and cleans it up.
    if (!keepScaled) await removeFile(scaled);
  }
};

const createDobVariants = async (
  input: string,
  region: { left: number; top: number; width: number; height: number }
) => {
  const variants: string[] = [];

  // Color variant is important for blue-background DOB text.
  const color = tempFile("dob-color");
  await sharp(input)
    .extract(region)
    .resize({ width: 2400, withoutEnlargement: false })
    .sharpen()
    .png()
    .toFile(color);
  variants.push(color);

  const gray = tempFile("dob-gray");
  await sharp(input)
    .extract(region)
    .resize({ width: 2400, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toFile(gray);
  variants.push(gray);

  for (const threshold of [140, 170]) {
    const file = tempFile(`dob-${threshold}`);
    await sharp(input)
      .extract(region)
      .resize({ width: 2400, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen()
      .threshold(threshold)
      .png()
      .toFile(file);
    variants.push(file);
  }

  return variants;
};

const extractDobFromVariants = async (worker: Worker, files: string[]) => {
  for (const file of files) {
    try {
      const result = await recognize(worker, file);
      const dob = extractDate(result.data.text || "");
      if (dob) return dob;
    } catch (error) {
      console.error("DOB OCR error:", error);
    }
  }

  return null;
};

export const extractPanData = async (
  inputPath: string
): Promise<OcrResult> => {
  const temporaryFiles: string[] = [];
  let worker: Worker | null = null;

  try {
    if (!fs.existsSync(inputPath)) {
      throw new Error("OCR input file not found");
    }

    worker = await createWorker("eng");

    const fullImage = await preprocessFull(inputPath);
    temporaryFiles.push(fullImage);

    const result = await recognize(worker, fullImage);
    const rawText = result.data.text || "";

    console.log("📝 Raw OCR text:\n", rawText);

    const panNumber = extractPanNumber(rawText);
    const name = refineName(extractName(rawText), panNumber);

    // First try the complete DOB from general OCR.
    let dateOfBirth = extractDate(rawText);

    // Main DOB strategy: detect label and OCR only the area below it.
    if (!dateOfBirth) {
      const dobTarget = await findDobRegion(worker, inputPath);

      if (dobTarget) {
        console.log("📍 DOB region:", dobTarget.region);

        temporaryFiles.push(dobTarget.imagePath);

        const variants = await createDobVariants(
          dobTarget.imagePath,
          dobTarget.region
        );

        temporaryFiles.push(...variants);
        dateOfBirth = await extractDobFromVariants(worker, variants);
      }
    }

    // Prefer Tesseract's own page-level confidence, then fall back to word average.
    const words = getWords(result.data);
    const confidenceValues = words
      .map((word) => word.confidence)
      .filter((value): value is number => typeof value === "number");

    const pageConfidence = (result.data as any).confidence;

    const confidence = Math.round(
      typeof pageConfidence === "number"
        ? pageConfidence
        : confidenceValues.length
          ? confidenceValues.reduce((sum, value) => sum + value, 0) /
            confidenceValues.length
          : rawText.trim()
            ? 50
            : 0
    );

    const finalResult: OcrResult = {
      panNumber,
      name,
      dateOfBirth,
      confidence
    };

    console.log("📦 Final OCR Result:", finalResult);
    return finalResult;
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }
    for (const file of temporaryFiles) {
      await removeFile(file);
    }
  }
};