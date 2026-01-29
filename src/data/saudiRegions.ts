// مناطق المملكة العربية السعودية
export const saudiRegions = [
  "الرياض",
  "مكة المكرمة",
  "المدينة المنورة",
  "القصيم",
  "المنطقة الشرقية",
  "عسير",
  "تبوك",
  "حائل",
  "الحدود الشمالية",
  "جازان",
  "نجران",
  "الباحة",
  "الجوف",
];

// مجالات التوريد
export const supplyCategories = [
  { name: "خضروات وفواكه", name_en: "Fruits & Vegetables" },
  { name: "لحوم ودواجن", name_en: "Meat & Poultry" },
  { name: "أسماك ومأكولات بحرية", name_en: "Seafood" },
  { name: "ألبان وأجبان", name_en: "Dairy & Cheese" },
  { name: "مخبوزات ومعجنات", name_en: "Bakery & Pastries" },
  { name: "بهارات وتوابل", name_en: "Spices & Seasonings" },
  { name: "زيوت ودهون", name_en: "Oils & Fats" },
  { name: "حبوب وبقوليات", name_en: "Grains & Legumes" },
  { name: "مشروبات", name_en: "Beverages" },
  { name: "معلبات ومجمدات", name_en: "Canned & Frozen Foods" },
  { name: "مستلزمات مطاعم", name_en: "Restaurant Supplies" },
  { name: "تغليف وتعبئة", name_en: "Packaging" },
  { name: "اخرى", name_en: "Other" },
];

// Helper function to get category display name based on language
export const getSupplyCategoryName = (category: { name: string; name_en?: string }, language: string): string => {
  return language === "en" && category.name_en ? category.name_en : category.name;
};
