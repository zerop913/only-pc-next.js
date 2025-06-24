import slugify from "slugify";

export function createSlug(name: string): string {
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    locale: "ru",
  });

  // Генерируем более короткий и понятный идентификатор
  // Текущая дата в формате ГГММДД + 3 случайные цифры
  const date = new Date();
  const dateStr =
    date.getFullYear().toString().slice(-2) +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0");
  const randomNum = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `${baseSlug}-${dateStr}${randomNum}`;
}

export const calculateBuildPrice = async (
  components: Record<string, string>
): Promise<number> => {
  let totalPrice = 0;

  try {
    const fetchPromises = Object.entries(components).map(
      async ([categorySlug, productSlug]) => {
        const response = await fetch(
          `/api/products/${categorySlug}/${productSlug}`
        );
        if (!response.ok) {
          if (process.env.NODE_ENV === "development") {
            console.error(`Failed to fetch product price for ${productSlug}`);
          }
          return 0;
        }

        const product = await response.json();
        const price = Number(product.price) || 0;
        if (process.env.NODE_ENV === "development") {
          console.log(`Price for ${productSlug}:`, price);
        }
        return price;
      }
    );
    const prices = await Promise.all(fetchPromises);
    totalPrice = prices.reduce((sum, price) => sum + price, 0);
    if (process.env.NODE_ENV === "development") {
      console.log("Total price calculated:", totalPrice);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error calculating build price:", error);
    }
  }

  return totalPrice;
};
