import { describe, expect, it } from "vitest";
import { getCourseImage, getCourseImageValue, resolveImageUrl } from "./courseImage";

// NOTE: these are synthetic fixtures exercising the extractor logic.
// They are NOT samples of the real API response.
describe("course image extraction", () => {
  it("keeps an absolute https URL", () => {
    expect(getCourseImage({ image: "https://cdn.example.com/a.png" })).toBe(
      "https://cdn.example.com/a.png"
    );
  });

  it("resolves a relative path against the base", () => {
    expect(getCourseImage({ thumbnail: "img/a.png" }, "https://host.example/api/")).toBe(
      "https://host.example/api/img/a.png"
    );
  });

  it("reads a nested image object", () => {
    expect(getCourseImageValue({ image: { url: "https://x.test/b.jpg" } })).toBe(
      "https://x.test/b.jpg"
    );
  });

  it("returns null when no image field exists or value is blank", () => {
    expect(getCourseImage({ title: "x" })).toBeNull();
    expect(getCourseImage({ image: "   " })).toBeNull();
    expect(getCourseImage("not a record")).toBeNull();
  });

  it("rejects unsafe schemes", () => {
    expect(resolveImageUrl("javascript:alert(1)", "https://h.test/")).toBeNull();
    expect(resolveImageUrl("data:image/png;base64,AAAA", "https://h.test/")).toBeNull();
  });

  it("gives different courses different images", () => {
    const a = getCourseImage({ image: "https://x.test/1.png" });
    const b = getCourseImage({ image: "https://x.test/2.png" });
    expect(a).not.toBe(b);
  });
});
