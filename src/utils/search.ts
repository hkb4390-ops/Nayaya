import type { Course } from "../types/api";

export function filterCourses(courses: Course[], query: string): Course[] {
  const q = query.trim().toLowerCase();
  if (!q) return courses;
  return courses.filter((course) => course.title.toLowerCase().includes(q));
}
