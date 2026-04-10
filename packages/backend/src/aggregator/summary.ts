import { MAX_SUMMARY_WORDS } from "@arsenal/shared";

/**
 * Generate a summary of no more than MAX_SUMMARY_WORDS words.
 * If the input is shorter, returns it as-is.
 * Always returns a non-empty string.
 */
export function generateSummary(fullText: string, maxWords: number = MAX_SUMMARY_WORDS): string {
  if (!fullText || fullText.trim().length === 0) {
    return "No summary available.";
  }

  const words = fullText.trim().split(/\s+/);

  if (words.length <= maxWords) {
    return words.join(" ");
  }

  return words.slice(0, maxWords).join(" ") + "...";
}
