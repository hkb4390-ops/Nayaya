import { FIELD_MAP } from "./fieldMap";
import { isNonEmptyString, isRecord } from "./records";
import { toSafeHttpUrl } from "./safeUrl";

/** Raw image value from a course record (string, or a string inside an image object). */
export function getCourseImageValue(course: unknown): string | null {
  if (!isRecord(course)) return null;

  for (const field of FIELD_MAP.image) {
    const value = course[field];
    if (isNonEmptyString(value)) return value.trim();

    if (isRecord(value)) {
      for (const key of FIELD_MAP.imageObjectKeys) {
        const nested = value[key];
        if (isNonEmptyString(nested)) return nested.trim();
      }
    }
  }
  return null;
}

export function resolveImageUrl(
  imageValue: string | null,
  imageBaseUrl: string = FIELD_MAP.upstreamBase
): string | null {
  if (!imageValue) return null;
  return toSafeHttpUrl(imageValue, imageBaseUrl);
}

/** The single entry point every component/normalizer uses for course images. */
export function getCourseImage(
  course: unknown,
  imageBaseUrl: string = FIELD_MAP.upstreamBase
): string | null {
  return resolveImageUrl(getCourseImageValue(course), imageBaseUrl);
}
