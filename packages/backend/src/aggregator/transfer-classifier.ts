import type { TransferType } from "@arsenal/shared";

interface TransferClassification {
  isTransfer: true;
  transferType: TransferType;
}

const CONFIRMED_PATTERNS = [
  /\bofficial\b/i,
  /\bconfirmed?\b/i,
  /\bsigned\b/i,
  /\bsigning\b/i,
  /\bcompleted?\s+deal\b/i,
  /\bhere\s+we\s+go\b/i,
  /\bannounce[ds]?\b/i,
];

const LOAN_PATTERNS = [
  /\bloan\b/i,
  /\bloaned?\b/i,
  /\bloan\s+(deal|move|spell)\b/i,
];

const CONTRACT_PATTERNS = [
  /\bcontract\s+(extension|renewal|extended)\b/i,
  /\bnew\s+(deal|contract)\b/i,
  /\brenewal\b/i,
  /\bextend(s|ed)?\b/i,
];

const DEPARTURE_PATTERNS = [
  /\bleav(e|es|ing)\b/i,
  /\bdepart(s|ed|ure)?\b/i,
  /\bsold\b/i,
  /\breleased?\b/i,
  /\bexit\b/i,
  /\bfarewell\b/i,
];

const RUMOR_PATTERNS = [
  /\btransfer\b/i,
  /\brumou?r\b/i,
  /\btarget\b/i,
  /\binterest(ed)?\b/i,
  /\bbid\b/i,
  /\boffer\b/i,
  /\bwant(s|ed)?\b/i,
  /\blink(s|ed)?\b/i,
  /\bchase\b/i,
  /\bpursu(e|ing)\b/i,
  /\bswoop\b/i,
  /\bscout(s|ed|ing)?\b/i,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/**
 * Classify content as transfer-related based on title/summary keywords.
 * Returns null if the content is not transfer-related.
 */
export function classifyTransferItem(
  title: string,
  summary: string
): TransferClassification | null {
  const combined = `${title} ${summary}`;

  // Check specific types first (more specific → less specific)
  if (matchesAny(combined, LOAN_PATTERNS)) {
    return { isTransfer: true, transferType: "loan" };
  }

  if (matchesAny(combined, CONTRACT_PATTERNS)) {
    return { isTransfer: true, transferType: "contract_extension" };
  }

  if (matchesAny(combined, DEPARTURE_PATTERNS)) {
    return { isTransfer: true, transferType: "departure" };
  }

  if (matchesAny(combined, CONFIRMED_PATTERNS)) {
    return { isTransfer: true, transferType: "confirmed_signing" };
  }

  if (matchesAny(combined, RUMOR_PATTERNS)) {
    return { isTransfer: true, transferType: "rumor" };
  }

  return null;
}
