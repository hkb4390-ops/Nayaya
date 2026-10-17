import type { ContentNode, ContentType } from "../types/api";
import { FIELD_MAP } from "./fieldMap";
import { isRecord, parseMaybeJson, pickString, type UnknownRecord } from "./records";
import { toSafeHttpUrl } from "./safeUrl";

const MAX_DEPTH = 50;

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

/** Child records of a node, plus whether any known child container was present. */
export function extractChildren(raw: UnknownRecord): {
  items: unknown[];
  hasChildKey: boolean;
} {
  const items: unknown[] = [];
  let hasChildKey = false;

  for (const key of FIELD_MAP.childArrays) {
    if (!(key in raw)) continue;
    const value = parseMaybeJson(raw[key]);
    if (Array.isArray(value)) {
      hasChildKey = true;
      items.push(...value);
    } else if (isRecord(value)) {
      const values = Object.values(value);
      if (values.length > 0 && values.every(isRecord)) {
        hasChildKey = true;
        items.push(...values);
      }
    }
  }
  return { items, hasChildKey };
}

function declaredType(raw: UnknownRecord): ContentType | null {
  const declared = pickString(raw, FIELD_MAP.type)?.toLowerCase();
  if (!declared) return null;
  if (/video/.test(declared)) return "video";
  if (/pdf|document/.test(declared)) return "pdf";
  if (/folder|chapter|section|dir|subject|topic|module/.test(declared)) return "folder";
  return null;
}

type Classified = Pick<ContentNode, "type" | "videoId" | "url">;

function classify(raw: UnknownRecord, hasChildKey: boolean): Classified {
  const videoRaw = pickString(raw, FIELD_MAP.videoId);
  const pdfRaw = pickString(raw, FIELD_MAP.pdfUrl);
  const pdfUrl = pdfRaw ? toSafeHttpUrl(pdfRaw, FIELD_MAP.upstreamBase) : null;
  const looksPdf = pdfUrl !== null && /\.pdf$/i.test(pdfUrl.split(/[?#]/)[0]);

  let type = declaredType(raw);
  if (!type) {
    if (videoRaw) type = "video";
    else if (looksPdf) type = "pdf";
    else if (hasChildKey) type = "folder";
  }

  if (type === "folder") return { type };

  if (type === "video") {
    if (videoRaw) {
      const direct = toSafeHttpUrl(videoRaw);
      return /^https?:\/\//i.test(videoRaw) && direct
        ? { type, url: direct }
        : { type, videoId: videoRaw };
    }
    return { type: "unknown" };
  }

  if (type === "pdf") {
    return pdfUrl ? { type, url: pdfUrl } : { type: "unknown" };
  }

  return { type: "unknown" };
}

function buildNodes(
  items: unknown[],
  parentKey: string,
  depth: number
): ContentNode[] {
  if (depth > MAX_DEPTH) return [];
  const usedKeys = new Set<string>();
  const nodes: ContentNode[] = [];

  items.forEach((item, index) => {
    if (!isRecord(item)) return; // malformed child: skipped, not faked

    const title = pickString(item, FIELD_MAP.nodeTitle) ?? "Untitled";
    const id = pickString(item, FIELD_MAP.nodeId);
    let key = `${parentKey}/${id ?? slug(title)}`;
    if (usedKeys.has(key)) key = `${key}~${index}`;
    usedKeys.add(key);

    const { items: childItems, hasChildKey } = extractChildren(item);
    const classified = classify(item, hasChildKey);

    nodes.push({
      key,
      title,
      ...classified,
      children:
        classified.type === "folder" ? buildNodes(childItems, key, depth + 1) : [],
    });
  });

  return nodes;
}

/** Build the content tree from the root of a course-details record. */
export function buildContentTree(root: UnknownRecord): ContentNode[] {
  return buildNodes(extractChildren(root).items, "root", 0);
}

/** Pure toggle used by the expand/collapse state. */
export function toggleKey(previous: ReadonlySet<string>, key: string): Set<string> {
  const next = new Set(previous);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export function countNodes(nodes: ContentNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0);
}
