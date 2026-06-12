// Approximate water content (% by weight) for common fruits, used to
// suggest the built-in water-content stat when an item joins the fruit
// category. Fruits with similar water content compare cleanly per gram.
export const FRUIT_WATER_CONTENT: Record<string, number> = {
  apple: 86,
  apricot: 86,
  banana: 75,
  blackberry: 88,
  blueberry: 84,
  cantaloupe: 90,
  cherry: 82,
  grape: 81,
  grapefruit: 88,
  kiwi: 83,
  lemon: 89,
  lime: 88,
  mango: 84,
  melon: 90,
  nectarine: 88,
  orange: 87,
  papaya: 88,
  peach: 89,
  pear: 84,
  pineapple: 86,
  plum: 87,
  raspberry: 86,
  strawberry: 91,
  watermelon: 92,
}

// Look up a default water content for an item name (e.g. "Gala Apples" -> 86)
export function suggestWaterContent(itemName: string): number | null {
  const lower = itemName.toLowerCase()
  for (const [fruit, water] of Object.entries(FRUIT_WATER_CONTENT)) {
    // Match singular and naive plural forms as whole words
    const pattern = new RegExp(`\\b${fruit}(s|es)?\\b`)
    if (pattern.test(lower)) {
      return water
    }
  }
  return null
}
