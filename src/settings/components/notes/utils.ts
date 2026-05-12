export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function makeUniqueSlug(base: string, existing: string[]) {
  let slug = slugify(base);
  let n = 1;
  while (existing.includes(slug)) slug = `${slugify(base)}-${n++}`;
  return slug;
}
