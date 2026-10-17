/**
 * FIELD MAP — ALL ENTRIES ARE UNVERIFIED CANDIDATES.
 *
 * The upstream API (studyapkmod.free.nf) blocked automated requests during
 * development, so none of these names were confirmed against a real response.
 * Open /inspect on the deployed site to see the real response shape, then trim
 * or correct these lists. This is the only file that should need editing.
 */
export const FIELD_MAP = {
  /** Origin used to resolve relative image / media paths. UNVERIFIED. */
  upstreamBase: "https://studyapkmod.free.nf/tbapi/",

  /** Keys that may wrap the list of courses in the list response. */
  listWrappers: ["data", "courses", "result", "results", "items", "list"],

  courseId: ["id", "_id", "courseid", "courseId", "course_id"],
  title: ["title", "name", "course_name", "courseName", "course_title"],
  description: ["description", "desc", "about", "details"],

  image: [
    "image",
    "thumbnail",
    "thumb",
    "cover",
    "cover_image",
    "course_image",
    "courseImage",
    "banner",
    "poster",
    "logo",
    "image_url",
    "thumbnail_url",
    "img",
  ],
  /** Keys tried inside an image value that is an object. */
  imageObjectKeys: ["url", "src", "path", "large", "medium", "original", "full"],

  /** Keys that may contain child items (folders, chapters, lessons...). */
  childArrays: [
    "children",
    "items",
    "contents",
    "content",
    "folders",
    "subfolders",
    "chapters",
    "lessons",
    "videos",
    "pdfs",
    "files",
    "topics",
    "subjects",
  ],

  nodeId: ["id", "_id", "folderid", "folder_id", "lessonid", "lesson_id"],
  nodeTitle: [
    "title",
    "name",
    "folder_name",
    "folderName",
    "chapter_name",
    "lesson_name",
    "course_name",
  ],
  type: ["type", "kind", "content_type", "contentType"],

  videoId: ["videoid", "video_id", "videoId", "video", "vid"],
  videoUrl: [
    "url",
    "video_url",
    "videoUrl",
    "src",
    "source",
    "link",
    "stream",
    "hls",
    "m3u8",
    "mp4",
    "file",
    "embed",
    "embed_url",
  ],
  pdfUrl: [
    "pdf",
    "pdf_url",
    "pdfUrl",
    "pdflink",
    "file_url",
    "fileUrl",
    "file",
    "url",
    "link",
  ],
} as const;
