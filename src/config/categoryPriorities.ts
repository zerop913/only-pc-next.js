export const CATEGORY_PRIORITIES = {
  "materinskie-platy": 1,
  processory: 2,
  videokarty: 3,
  "operativnaya-pamyat": 4,
  nakopiteli: 5,
  "bloki-pitaniya": 6,
  korpusa: 7,
  kulery: 8,
} as const;

export type CategorySlug = keyof typeof CATEGORY_PRIORITIES;
