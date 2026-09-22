export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateDiscount(mrp: number, sellingPrice: number): number {
  if (!mrp || mrp <= sellingPrice) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function generateProductId(categorySlug: string = 'GEN', subcategorySlug: string = 'ITEM'): string {
  const catCode = categorySlug.slice(0, 4).toUpperCase();
  const subCode = subcategorySlug.slice(0, 5).toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `MD-${catCode}-${subCode}-${randomNum}`;
}
