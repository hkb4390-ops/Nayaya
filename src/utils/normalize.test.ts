import { describe, expect, it } from "vitest";
import { ApiError } from "../services/apiErrors";
import { normalizeCourses, normalizeCourseDetails, normalizeVideo } from "./normalizeApiResponse";

// Synthetic fixtures for the parsing logic; not real API data.
describe("normalizeCourses", () => {
  it("accepts a bare array", () => {
    const { courses } = normalizeCourses([{ id: "1", title: "A" }]);
    expect(courses.map((c) => c.id)).toEqual(["1"]);
  });

  it("accepts a wrapped array and a JSON string", () => {
    expect(normalizeCourses({ data: [{ id: "1", title: "A" }] }).courses).toHaveLength(1);
    expect(normalizeCourses(JSON.stringify([{ id: "2", title: "B" }])).courses[0].id).toBe("2");
  });

  it("handles an empty list", () => {
    expect(normalizeCourses([]).courses).toEqual([]);
  });

  it("rejects malformed and duplicate records instead of faking them", () => {
    const { courses, rejected } = normalizeCourses([
      { id: "1", title: "A" },
      { id: "1", title: "dup" },
      { title: "no id" },
      "junk",
    ]);
    expect(courses).toHaveLength(1);
    expect(rejected).toBe(3);
  });

  it("throws on an unexpected shape and on in-body errors", () => {
    expect(() => normalizeCourses("hello")).toThrow(ApiError);
    expect(() => normalizeCourses({ success: false, error: "nope" })).toThrow(ApiError);
  });
});

describe("normalizeCourseDetails", () => {
  it("unwraps the record and builds the tree", () => {
    const d = normalizeCourseDetails(
      { data: { id: "c1", title: "Course", folders: [{ id: "f", title: "F", items: [] }] } },
      "c1"
    );
    expect(d.title).toBe("Course");
    expect(d.tree[0].type).toBe("folder");
  });

  it("falls back to the requested id when the response has none", () => {
    expect(normalizeCourseDetails({ title: "T", folders: [] }, "req").id).toBe("req");
  });
});

describe("normalizeVideo", () => {
  it("finds a direct mp4 url", () => {
    const v = normalizeVideo({ title: "V", url: "https://x.test/v.mp4" });
    expect(v.kind).toBe("file");
    expect(v.url).toBe("https://x.test/v.mp4");
  });

  it("reports no url when none is recognised", () => {
    const v = normalizeVideo({ title: "V", foo: "bar" });
    expect(v.url).toBeNull();
    expect(v.fields).toContain("foo");
  });
});
