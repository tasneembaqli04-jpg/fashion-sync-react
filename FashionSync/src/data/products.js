export function calcVariantsTotal(variants) {
  if (!Array.isArray(variants)) return 0;

  return variants.reduce((sum, variant) => {
    const sizes = variant?.sizes || {};
    return (
      sum +
      Object.values(sizes).reduce((acc, qty) => acc + (parseInt(qty, 10) || 0), 0)
    );
  }, 0);
}

export function defaultVariantsFor() {
  return [
    {
      colorName: "שחור",
      colorHex: "#111111",
      sizes: { S: 1, M: 2, L: 1, XL: 0 },
    },
    {
      colorName: "לבן",
      colorHex: "#f6f6f6",
      sizes: { S: 1, M: 1, L: 0, XL: 0 },
    },
  ];
}

export function normalizeProduct(product) {
  const normalized = { ...product };

  if (normalized.minStock === undefined || Number.isNaN(parseInt(normalized.minStock, 10))) {
    normalized.minStock = 10;
  }

  if (normalized.notifyCount === undefined || Number.isNaN(parseInt(normalized.notifyCount, 10))) {
    normalized.notifyCount = 0;
  }

  if (!normalized.gender) normalized.gender = "";
  if (!normalized.cat) normalized.cat = "";
  if (!normalized.img) normalized.img = "";
  if (!normalized.desc) normalized.desc = "";

  if (normalized.price === undefined || Number.isNaN(parseFloat(normalized.price))) {
    normalized.price = 0;
  }

  if (
    normalized.salesLastMonth === undefined ||
    Number.isNaN(parseInt(normalized.salesLastMonth, 10))
  ) {
    normalized.salesLastMonth = 0;
  }

  if (!Array.isArray(normalized.variants)) {
    normalized.variants = defaultVariantsFor();
  }

  normalized.stock = calcVariantsTotal(normalized.variants);

  return normalized;
}

export const PRODUCTS_SEED = [
  normalizeProduct({
    code: "FS-001",
    name: "חולצת לינן קלאסית",
    gender: "גברים",
    cat: "חולצות",
    price: 189,
    minStock: 10,
    notifyCount: 0,
    trending: true,
    bestseller: false,
    desc: "חולצת לינן איכותית.",
    salesLastMonth: 0,
    img: "https://img.kwcdn.com/product/fancy/c61fb9bc-58ae-40c5-bd3e-b99ba62d5b9b.jpg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp",
    variants: [
      {
        colorName: "לבן",
        colorHex: "#f6f6f6",
        sizes: { S: 3, M: 4, L: 3, XL: 2 },
      },
      {
        colorName: "שחור",
        colorHex: "#111111",
        sizes: { S: 1, M: 3, L: 2, XL: 1 },
      },
    ],
  }),

  normalizeProduct({
    code: "FS-002",
    name: "ג'ינס סלים פיט",
    gender: "גברים",
    cat: "מכנסיים",
    price: 349,
    minStock: 10,
    notifyCount: 0,
    trending: false,
    bestseller: true,
    desc: "ג'ינס כהה.",
    salesLastMonth: 1,
    img: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400",
    variants: [
      {
        colorName: "כחול כהה",
        colorHex: "#1f3a6b",
        sizes: { 28: 1, 30: 1, 32: 1, 34: 0 },
      },
      {
        colorName: "שחור",
        colorHex: "#111111",
        sizes: { 28: 0, 30: 1, 32: 0, 34: 0 },
      },
    ],
  }),

  normalizeProduct({
    code: "FS-003",
    name: "שמלת קיץ פרחונית",
    gender: "נשים",
    cat: "שמלות",
    price: 279,
    minStock: 10,
    notifyCount: 18,
    trending: true,
    bestseller: true,
    desc: "שמלה קיצית.",
    salesLastMonth: 0,
    img: "https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400",
    variants: [
      {
        colorName: "ירוק",
        colorHex: "#2e8b57",
        sizes: { XS: 0, S: 0, M: 0, L: 0 },
      },
      {
        colorName: "ורוד",
        colorHex: "#d85b8a",
        sizes: { XS: 0, S: 0, M: 0, L: 0 },
      },
    ],
  }),

  normalizeProduct({
    code: "FS-004",
    name: "ז'קט עור שחור",
    gender: "נשים",
    cat: "עליוניות",
    price: 699,
    minStock: 10,
    notifyCount: 0,
    trending: false,
    bestseller: false,
    desc: "ז'קט עור.",
    salesLastMonth: 2,
    img: "https://xcdn.next.co.uk/common/items/default/default/itemimages/3_4Ratio/product/lge/103395s5.jpg?im=Resize,width=400",
    variants: [
      {
        colorName: "שחור",
        colorHex: "#111111",
        sizes: { XS: 0, S: 1, M: 1, L: 0, XL: 0 },
      },
      {
        colorName: "חום",
        colorHex: "#6b3f2a",
        sizes: { XS: 0, S: 0, M: 1, L: 0, XL: 0 },
      },
    ],
  }),

  normalizeProduct({
    code: "FS-005",
    name: "חולצת טי בייסיק",
    gender: "נשים",
    cat: "חולצות",
    price: 99,
    minStock: 10,
    notifyCount: 0,
    trending: false,
    bestseller: true,
    desc: "חולצת טי נוחה.",
    salesLastMonth: 15,
    img: "https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400",
    variants: [
      {
        colorName: "לבן",
        colorHex: "#f6f6f6",
        sizes: { XS: 3, S: 5, M: 6, L: 4, XL: 2 },
      },
      {
        colorName: "שחור",
        colorHex: "#111111",
        sizes: { XS: 2, S: 3, M: 4, L: 2, XL: 1 },
      },
    ],
  }),

  normalizeProduct({
    code: "FS-006",
    name: "שמלת ערב אלגנטית",
    gender: "נשים",
    cat: "שמלות",
    price: 599,
    minStock: 10,
    notifyCount: 11,
    trending: true,
    bestseller: false,
    desc: "שמלת ערב.",
    salesLastMonth: 0,
    img: "https://images.pexels.com/photos/1755428/pexels-photo-1755428.jpeg?auto=compress&cs=tinysrgb&w=400",
    variants: [
      {
        colorName: "שמפניה",
        colorHex: "#d9c5a3",
        sizes: { XS: 0, S: 0, M: 0, L: 0 },
      },
      {
        colorName: "שחור",
        colorHex: "#111111",
        sizes: { XS: 0, S: 0, M: 0, L: 0 },
      },
    ],
  }),

  normalizeProduct({
    code: "FS-007",
    name: "עליונית פוטר חמה",
    gender: "גברים",
    cat: "עליוניות",
    price: 459,
    minStock: 10,
    notifyCount: 0,
    trending: false,
    bestseller: false,
    desc: "פוטר חם.",
    salesLastMonth: 0,
    img: "https://images.pexels.com/photos/6311600/pexels-photo-6311600.jpeg?auto=compress&cs=tinysrgb&w=400",
    variants: [
      {
        colorName: "אפור",
        colorHex: "#7b7f87",
        sizes: { S: 1, M: 2, L: 2, XL: 0 },
      },
      {
        colorName: "שחור",
        colorHex: "#111111",
        sizes: { S: 0, M: 1, L: 1, XL: 0 },
      },
    ],
  }),

  normalizeProduct({
    code: "FS-008",
    name: "מכנסי טרנינג נוח",
    gender: "גברים",
    cat: "מכנסיים",
    price: 219,
    minStock: 10,
    notifyCount: 11,
    trending: false,
    bestseller: true,
    desc: "מכנסי טרנינג.",
    salesLastMonth: 1,
    img: "https://www.delta.co.il/pub/media/catalog/product/cache/f3dca7ff1d37a6b21edba38be76bc1a9/l/n/LN00956_LM05H_3-1754217257726666.jpg",
    variants: [
      {
        colorName: "שחור",
        colorHex: "#111111",
        sizes: { S: 0, M: 0, L: 0, XL: 0 },
      },
      {
        colorName: "ירוק זית",
        colorHex: "#556b2f",
        sizes: { S: 0, M: 0, L: 0, XL: 0 },
      },
    ],
  }),

  normalizeProduct({
    code: "FS-009",
    name: "חולצת מכופתרת קלאסית",
    gender: "גברים",
    cat: "חולצות",
    price: 229,
    minStock: 10,
    notifyCount: 0,
    trending: true,
    bestseller: false,
    desc: "מכופתרת אלגנטית.",
    salesLastMonth: 0,
    img: "https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=400",
    variants: [
      {
        colorName: "לבן",
        colorHex: "#f6f6f6",
        sizes: { S: 1, M: 2, L: 2, XL: 1 },
      },
      {
        colorName: "תכלת",
        colorHex: "#6aa7ff",
        sizes: { S: 0, M: 1, L: 1, XL: 0 },
      },
    ],
  }),

  normalizeProduct({
    code: "FS-010",
    name: "חצאית מידי אלגנטית",
    gender: "נשים",
    cat: "שמלות",
    price: 199,
    minStock: 10,
    notifyCount: 0,
    trending: true,
    bestseller: true,
    desc: "חצאית מידי.",
    salesLastMonth: 2,
    img: "https://nitedress.co.il/wp-content/uploads/2021/03/41656-d8640c.jpeg",
    variants: [
      {
        colorName: "שחור",
        colorHex: "#111111",
        sizes: { XS: 1, S: 2, M: 3, L: 2 },
      },
      {
        colorName: "בז",
        colorHex: "#d2b48c",
        sizes: { XS: 0, S: 1, M: 1, L: 0 },
      },
    ],
  }),
];