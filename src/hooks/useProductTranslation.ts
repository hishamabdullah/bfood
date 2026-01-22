import { useTranslation } from "react-i18next";

interface TranslatedProduct {
  name: string;
  name_en?: string | null;
  name_ur?: string | null;
  name_hi?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_ur?: string | null;
  description_hi?: string | null;
  [key: string]: any;
}

export const useProductTranslation = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const getProductName = (product: TranslatedProduct): string => {
    if (!product) return "";

    switch (currentLang) {
      case "en":
        return product.name_en || product.name;
      case "ur":
        return product.name_ur || product.name;
      case "hi":
        return product.name_hi || product.name;
      default:
        return product.name;
    }
  };

  const getProductDescription = (product: TranslatedProduct): string | null => {
    if (!product) return null;

    switch (currentLang) {
      case "en":
        return product.description_en || product.description || null;
      case "ur":
        return product.description_ur || product.description || null;
      case "hi":
        return product.description_hi || product.description || null;
      default:
        return product.description || null;
    }
  };

  return { getProductName, getProductDescription, currentLang };
};
