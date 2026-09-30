export function serializeProduct(p) {
  return {
    id: p.id,
    sku: p.sku,
    model: p.model,
    name: p.name,
    brand: p.brand,
    description: p.description,
    category: p.category_slug ? { slug: p.category_slug, name: p.category_name } : undefined,
    price: p.price,
    regularPrice: p.regular_price,
    savings: p.regular_price - p.price,
    onSale: p.price < p.regular_price,
    stock: p.stock,
    inStock: p.stock > 0,
    rating: p.rating_avg,
    reviewCount: p.rating_count,
    image: `/api/images/${p.sku}.svg`,
    images: [0, 1, 2, 3].map((v) => `/api/images/${p.sku}.svg?v=${v}`),
    highlights: JSON.parse(p.highlights),
    specs: JSON.parse(p.specs),
    isFeatured: !!p.is_featured,
    isDealOfDay: !!p.is_deal_of_day,
    isActive: !!p.is_active,
  };
}

export const PRODUCT_SELECT = `SELECT p.*, c.slug AS category_slug, c.name AS category_name, c.icon AS category_icon
  FROM products p JOIN categories c ON c.id = p.category_id`;

