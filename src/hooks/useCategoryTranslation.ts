import { useTranslation } from "react-i18next";

interface TranslatedCategory {
  name: string;
  name_en?: string | null;
  [key: string]: any;
}

export const useCategoryTranslation = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const getCategoryName = (category: TranslatedCategory): string => {
    if (!category) return "";

    if (currentLang === "en") {
      return category.name_en || category.name;
    }
    return category.name;
  };

  return { getCategoryName, currentLang };
};
