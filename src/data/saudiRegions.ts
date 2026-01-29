// مناطق المملكة العربية السعودية مع الترجمة
export interface Region {
  name: string;
  name_en: string;
}

export const saudiRegions: Region[] = [
  { name: "الرياض", name_en: "Riyadh" },
  { name: "مكة المكرمة", name_en: "Makkah" },
  { name: "المدينة المنورة", name_en: "Madinah" },
  { name: "القصيم", name_en: "Qassim" },
  { name: "المنطقة الشرقية", name_en: "Eastern Province" },
  { name: "عسير", name_en: "Asir" },
  { name: "تبوك", name_en: "Tabuk" },
  { name: "حائل", name_en: "Hail" },
  { name: "الحدود الشمالية", name_en: "Northern Borders" },
  { name: "جازان", name_en: "Jazan" },
  { name: "نجران", name_en: "Najran" },
  { name: "الباحة", name_en: "Bahah" },
  { name: "الجوف", name_en: "Jawf" },
];

// المدن حسب المنطقة
export interface City {
  name: string;
  name_en: string;
  region: string; // Arabic region name
}

export const saudiCities: City[] = [
  // منطقة الرياض
  { name: "الرياض", name_en: "Riyadh", region: "الرياض" },
  { name: "الخرج", name_en: "Al Kharj", region: "الرياض" },
  { name: "الدرعية", name_en: "Diriyah", region: "الرياض" },
  { name: "المجمعة", name_en: "Al Majma'ah", region: "الرياض" },
  { name: "وادي الدواسر", name_en: "Wadi ad-Dawasir", region: "الرياض" },
  { name: "الأفلاج", name_en: "Al Aflaj", region: "الرياض" },
  { name: "الزلفي", name_en: "Zulfi", region: "الرياض" },
  { name: "شقراء", name_en: "Shaqra", region: "الرياض" },
  { name: "حوطة بني تميم", name_en: "Howtat Bani Tamim", region: "الرياض" },
  { name: "الدوادمي", name_en: "Dawadmi", region: "الرياض" },

  // منطقة مكة المكرمة
  { name: "مكة المكرمة", name_en: "Makkah", region: "مكة المكرمة" },
  { name: "جدة", name_en: "Jeddah", region: "مكة المكرمة" },
  { name: "الطائف", name_en: "Taif", region: "مكة المكرمة" },
  { name: "رابغ", name_en: "Rabigh", region: "مكة المكرمة" },
  { name: "القنفذة", name_en: "Al Qunfudhah", region: "مكة المكرمة" },
  { name: "الليث", name_en: "Al Lith", region: "مكة المكرمة" },
  { name: "خليص", name_en: "Khulais", region: "مكة المكرمة" },
  { name: "الجموم", name_en: "Al Jumum", region: "مكة المكرمة" },

  // منطقة المدينة المنورة
  { name: "المدينة المنورة", name_en: "Madinah", region: "المدينة المنورة" },
  { name: "ينبع", name_en: "Yanbu", region: "المدينة المنورة" },
  { name: "العلا", name_en: "Al Ula", region: "المدينة المنورة" },
  { name: "المهد", name_en: "Mahd Ad Dhahab", region: "المدينة المنورة" },
  { name: "بدر", name_en: "Badr", region: "المدينة المنورة" },
  { name: "خيبر", name_en: "Khaybar", region: "المدينة المنورة" },

  // منطقة القصيم
  { name: "بريدة", name_en: "Buraydah", region: "القصيم" },
  { name: "عنيزة", name_en: "Unaizah", region: "القصيم" },
  { name: "الرس", name_en: "Ar Rass", region: "القصيم" },
  { name: "البكيرية", name_en: "Al Bukayriyah", region: "القصيم" },
  { name: "المذنب", name_en: "Al Mithnab", region: "القصيم" },
  { name: "البدائع", name_en: "Al Badayea", region: "القصيم" },

  // المنطقة الشرقية
  { name: "الدمام", name_en: "Dammam", region: "المنطقة الشرقية" },
  { name: "الظهران", name_en: "Dhahran", region: "المنطقة الشرقية" },
  { name: "الخبر", name_en: "Khobar", region: "المنطقة الشرقية" },
  { name: "الجبيل", name_en: "Jubail", region: "المنطقة الشرقية" },
  { name: "القطيف", name_en: "Qatif", region: "المنطقة الشرقية" },
  { name: "الأحساء", name_en: "Al Ahsa", region: "المنطقة الشرقية" },
  { name: "حفر الباطن", name_en: "Hafar Al Batin", region: "المنطقة الشرقية" },
  { name: "رأس تنورة", name_en: "Ras Tanura", region: "المنطقة الشرقية" },
  { name: "بقيق", name_en: "Buqayq", region: "المنطقة الشرقية" },
  { name: "الخفجي", name_en: "Khafji", region: "المنطقة الشرقية" },

  // منطقة عسير
  { name: "أبها", name_en: "Abha", region: "عسير" },
  { name: "خميس مشيط", name_en: "Khamis Mushait", region: "عسير" },
  { name: "بيشة", name_en: "Bisha", region: "عسير" },
  { name: "النماص", name_en: "An Namas", region: "عسير" },
  { name: "محايل عسير", name_en: "Muhayil Asir", region: "عسير" },
  { name: "ظهران الجنوب", name_en: "Dhahran Al Janub", region: "عسير" },
  { name: "سراة عبيدة", name_en: "Sarat Abidah", region: "عسير" },

  // منطقة تبوك
  { name: "تبوك", name_en: "Tabuk", region: "تبوك" },
  { name: "الوجه", name_en: "Al Wajh", region: "تبوك" },
  { name: "ضباء", name_en: "Duba", region: "تبوك" },
  { name: "تيماء", name_en: "Tayma", region: "تبوك" },
  { name: "أملج", name_en: "Umluj", region: "تبوك" },
  { name: "حقل", name_en: "Haql", region: "تبوك" },

  // منطقة حائل
  { name: "حائل", name_en: "Hail", region: "حائل" },
  { name: "بقعاء", name_en: "Baqaa", region: "حائل" },
  { name: "الغزالة", name_en: "Al Ghazalah", region: "حائل" },
  { name: "الشنان", name_en: "Ash Shinan", region: "حائل" },

  // منطقة الحدود الشمالية
  { name: "عرعر", name_en: "Arar", region: "الحدود الشمالية" },
  { name: "رفحاء", name_en: "Rafha", region: "الحدود الشمالية" },
  { name: "طريف", name_en: "Turaif", region: "الحدود الشمالية" },

  // منطقة جازان
  { name: "جازان", name_en: "Jazan", region: "جازان" },
  { name: "صبيا", name_en: "Sabya", region: "جازان" },
  { name: "أبو عريش", name_en: "Abu Arish", region: "جازان" },
  { name: "صامطة", name_en: "Samtah", region: "جازان" },
  { name: "الدرب", name_en: "Ad Darb", region: "جازان" },
  { name: "فرسان", name_en: "Farasan", region: "جازان" },

  // منطقة نجران
  { name: "نجران", name_en: "Najran", region: "نجران" },
  { name: "شرورة", name_en: "Sharurah", region: "نجران" },
  { name: "حبونا", name_en: "Hubuna", region: "نجران" },

  // منطقة الباحة
  { name: "الباحة", name_en: "Bahah", region: "الباحة" },
  { name: "بلجرشي", name_en: "Baljurashi", region: "الباحة" },
  { name: "المندق", name_en: "Al Mandaq", region: "الباحة" },
  { name: "المخواة", name_en: "Al Makhwah", region: "الباحة" },

  // منطقة الجوف
  { name: "سكاكا", name_en: "Sakaka", region: "الجوف" },
  { name: "دومة الجندل", name_en: "Dumat Al Jandal", region: "الجوف" },
  { name: "القريات", name_en: "Qurayyat", region: "الجوف" },
];

// مجالات التوريد
export interface SupplyCategory {
  name: string;
  name_en: string;
}

export const supplyCategories: SupplyCategory[] = [
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

// Helper functions
export const getRegionName = (region: Region | string, language: string): string => {
  if (typeof region === "string") {
    const found = saudiRegions.find(r => r.name === region);
    return language === "en" && found?.name_en ? found.name_en : region;
  }
  return language === "en" && region.name_en ? region.name_en : region.name;
};

export const getCityName = (city: City | string, language: string): string => {
  if (typeof city === "string") {
    const found = saudiCities.find(c => c.name === city);
    return language === "en" && found?.name_en ? found.name_en : city;
  }
  return language === "en" && city.name_en ? city.name_en : city.name;
};

export const getSupplyCategoryName = (category: { name: string; name_en?: string }, language: string): string => {
  return language === "en" && category.name_en ? category.name_en : category.name;
};

// Get cities by region
export const getCitiesByRegion = (regionName: string): City[] => {
  return saudiCities.filter(city => city.region === regionName);
};

// Legacy support - array of region names for backward compatibility
export const saudiRegionNames = saudiRegions.map(r => r.name);
