import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function DynamicFavicon() {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    const faviconUrl = settings?.favicon_url;
    
    if (faviconUrl) {
      // Update all favicon links
      const links = document.querySelectorAll<HTMLLinkElement>(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
      );
      
      links.forEach((link) => {
        link.href = `${faviconUrl}?v=${Date.now()}`;
      });
    }
  }, [settings?.favicon_url]);

  return null;
}
