import { useTranslation } from "react-i18next";

interface TranslatedProduct {
  name: string;
  name_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  [key: string]: any;
}

export const useProductTranslation = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const getProductName = (product: TranslatedProduct): string => {
    if (!product) return "";

    if (currentLang === "en") {
      return product.name_en || product.name;
    }
    return product.name;
  };

  const getProductDescription = (product: TranslatedProduct): string | null => {
    if (!product) return null;

    if (currentLang === "en") {
      return product.description_en || product.description || null;
    }
    return product.description || null;
  };

  return { getProductName, getProductDescription, currentLang };
};
