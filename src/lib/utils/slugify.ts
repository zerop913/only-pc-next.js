import slugify from "slugify";

export function createSlug(str: string): string {
  return slugify(str, {
    lower: true,
    strict: true,
    locale: "ru",
    trim: true,
  });
}
