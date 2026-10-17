import { ApiError } from "../services/apiErrors";
import type {
  Course,
  CourseDetails,
  CourseListResult,
  VideoKind,
  VideoSource,
} from "../types/api";
import { buildContentTree } from "./contentTree";
import { getCourseImage } from "./courseImage";
import { FIELD_MAP } from "./fieldMap";
import { isRecord, parseMaybeJson, pickString } from "./records";
import { toSafeHttpUrl } from "./safeUrl";

/** Throws if the payload reports an error inside its JSON body. */
export function assertNoApiError(payload: unknown): void {
  if (!isRecord(payload)) return;
  const failed =
    payload.success === false ||
    payload.status === "error" ||
    payload.ok === false;
  const message =
    typeof payload.error === "string"
      ? payload.error
      : typeof payload.message === "string" && failed
        ? payload.message
        : undefined;
  if (failed || (typeof payload.error === "string" && payload.error)) {
    throw new ApiError("upstream", message ?? "The API reported an error.");
  }
}

/** Find the array of records in a list response, whatever wrapper it uses. */
export function extractList(payload: unknown, depth = 0): unknown[] | null {
  const value = parseMaybeJson(payload);
  if (Array.isArray(value)) return value;
  if (!isRecord(value) || depth > 3) return null;

  for (const key of FIELD_MAP.listWrappers) {
    const inner = parseMaybeJson(value[key]);
    if (Array.isArray(inner)) return inner;
    if (isRecord(inner)) {
      const nested = extractList(inner, depth + 1);
      if (nested) return nested;
    }
  }

  const values = Object.values(value);
  if (values.length > 0 && values.every(isRecord)) return values;
  return null;
}

export function normalizeCourse(raw: unknown): Course | null {
  if (!isRecord(raw)) return null;
  const id = pickString(raw, FIELD_MAP.courseId);
  const title = pickString(raw, FIELD_MAP.title);
  if (!id || !title) return null;
  return {
    id,
    title,
    imageUrl: getCourseImage(raw),
    description: pickString(raw, FIELD_MAP.description),
    raw,
  };
}

export function normalizeCourses(payload: unknown): CourseListResult {
  const parsed = parseMaybeJson(payload);
  assertNoApiError(parsed);
  const list = extractList(parsed);
  if (!list) {
    throw new ApiError("shape", "Course list was not found in the response.");
  }

  const seen = new Set<string>();
  const courses: Course[] = [];
  let rejected = 0;

  for (const item of list) {
    const course = normalizeCourse(item);
    if (!course || seen.has(course.id)) {
      rejected += 1;
      continue;
    }
    seen.add(course.id);
    courses.push(course);
  }
  return { courses, rejected };
}

function findDetailRoot(payload: unknown): Record<string, unknown> | null {
  const value = parseMaybeJson(payload);
  const unwrapped = Array.isArray(value) && value.length === 1 ? value[0] : value;
  if (!isRecord(unwrapped)) return null;

  const candidates = [unwrapped, unwrapped.data, unwrapped.course, unwrapped.result]
    .map(parseMaybeJson)
    .filter(isRecord);

  for (const candidate of candidates) {
    const hasIdentity =
      pickString(candidate, FIELD_MAP.title) || pickString(candidate, FIELD_MAP.courseId);
    const hasChildren = FIELD_MAP.childArrays.some((k) => k in candidate);
    if (hasIdentity || hasChildren) return candidate;
  }
  return unwrapped;
}

export function normalizeCourseDetails(
  payload: unknown,
  requestedId: string
): CourseDetails {
  assertNoApiError(parseMaybeJson(payload));
  const root = findDetailRoot(payload);
  if (!root) {
    throw new ApiError("shape", "Course details were not in the expected format.");
  }
  return {
    id: pickString(root, FIELD_MAP.courseId) ?? requestedId,
    title: pickString(root, FIELD_MAP.title) ?? "",
    imageUrl: getCourseImage(root),
    description: pickString(root, FIELD_MAP.description),
    tree: buildContentTree(root),
    raw: root,
  };
}

function kindFor(url: string, fieldName: string): VideoKind {
  if (/embed/i.test(fieldName)) return "embed";
  const path = url.split(/[?#]/)[0].toLowerCase();
  if (/\.(mp4|webm|ogg|mov|m4v)$/.test(path)) return "file";
  if (path.endsWith(".m3u8")) return "hls";
  return "unknown";
}

function findVideoUrl(
  obj: Record<string, unknown>,
  depth = 0
): { url: string; field: string } | null {
  for (const field of FIELD_MAP.videoUrl) {
    const value = obj[field];
    if (typeof value === "string") {
      const url = toSafeHttpUrl(value, FIELD_MAP.upstreamBase);
      if (url) return { url, field };
    }
  }
  if (depth < 3) {
    for (const value of Object.values(obj)) {
      const inner = parseMaybeJson(value);
      if (isRecord(inner)) {
        const found = findVideoUrl(inner, depth + 1);
        if (found) return found;
      }
    }
  }
  return null;
}

export function normalizeVideo(payload: unknown): VideoSource {
  const parsed = parseMaybeJson(payload);
  assertNoApiError(parsed);
  const root = Array.isArray(parsed) && parsed.length === 1 ? parsed[0] : parsed;
  if (!isRecord(root)) {
    throw new ApiError("shape", "Video information was not in the expected format.");
  }
  const found = findVideoUrl(root);
  return {
    title: pickString(root, FIELD_MAP.title),
    url: found?.url ?? null,
    kind: found ? kindFor(found.url, found.field) : "unknown",
    fields: Object.keys(root),
  };
}

/** Compact structural summary of any JSON value, used by the /inspect page. */
export function describeShape(value: unknown, depth = 0): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "array(0)";
    return `array(${value.length}) of ${describeShape(value[0], depth + 1)}`;
  }
  if (isRecord(value)) {
    if (depth > 2) return "object";
    const entries = Object.entries(value)
      .slice(0, 25)
      .map(([k, v]) => `${k}: ${describeShape(v, depth + 1)}`);
    return `{ ${entries.join(", ")} }`;
  }
  return typeof value;
}
