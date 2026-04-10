import type { ContentType } from "@arsenal/shared";
import {
  READING_RATE_WPM,
  DURATION_FORMAT_READ,
  DURATION_FORMAT_LISTEN,
  DURATION_FORMAT_WATCH,
  DURATION_UNKNOWN,
} from "@arsenal/shared";

/**
 * Compute a human-readable duration label for a content item.
 * - article/blog/newspaper: ceil(wordCount / 200) min read
 * - podcast: X min listen (from raw seconds)
 * - video: X min watch (from raw seconds)
 * - unknown: "Duration unknown"
 */
export function computeDurationLabel(
  contentType: ContentType,
  rawWordCount?: number,
  rawDurationSeconds?: number
): string {
  const textTypes: ContentType[] = ["article", "blog", "newspaper"];

  if (textTypes.includes(contentType)) {
    if (rawWordCount != null && rawWordCount > 0) {
      const minutes = Math.ceil(rawWordCount / READING_RATE_WPM);
      return `${minutes} ${DURATION_FORMAT_READ}`;
    }
    return DURATION_UNKNOWN;
  }

  if (contentType === "podcast") {
    if (rawDurationSeconds != null && rawDurationSeconds > 0) {
      const minutes = Math.ceil(rawDurationSeconds / 60);
      return `${minutes} ${DURATION_FORMAT_LISTEN}`;
    }
    return DURATION_UNKNOWN;
  }

  if (contentType === "video") {
    if (rawDurationSeconds != null && rawDurationSeconds > 0) {
      const minutes = Math.ceil(rawDurationSeconds / 60);
      return `${minutes} ${DURATION_FORMAT_WATCH}`;
    }
    return DURATION_UNKNOWN;
  }

  return DURATION_UNKNOWN;
}
