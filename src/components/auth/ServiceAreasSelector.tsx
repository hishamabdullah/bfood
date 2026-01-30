import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MapPin, ChevronDown, ChevronUp, X } from "lucide-react";
import { saudiRegions, saudiCities, getRegionName, getCityName, type Region, type City } from "@/data/saudiRegions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ServiceAreasSelectorProps {
  selectedRegions: string[];
  selectedCities: string[];
  onRegionsChange: (regions: string[]) => void;
  onCitiesChange: (cities: string[]) => void;
  disabled?: boolean;
}

// Helper to get cities by region
const getCitiesForRegion = (regionName: string): City[] => {
  return saudiCities.filter(city => city.region === regionName);
};

const ServiceAreasSelector = ({
  selectedRegions,
  selectedCities,
  onRegionsChange,
  onCitiesChange,
  disabled = false,
}: ServiceAreasSelectorProps) => {
  const { t } = useTranslation();
  const [expandedRegions, setExpandedRegions] = useState<string[]>([]);

  const toggleRegionExpand = useCallback((regionName: string) => {
    setExpandedRegions(prev =>
      prev.includes(regionName)
        ? prev.filter(r => r !== regionName)
        : [...prev, regionName]
    );
  }, []);

  const handleRegionToggle = useCallback((regionName: string) => {
    const regionCities = getCitiesForRegion(regionName).map(c => c.name);
    const isSelected = selectedRegions.includes(regionName);
    
    if (isSelected) {
      // إزالة المنطقة وجميع مدنها
      onRegionsChange(selectedRegions.filter(r => r !== regionName));
      onCitiesChange(selectedCities.filter(c => !regionCities.includes(c)));
    } else {
      // إضافة المنطقة وجميع مدنها
      onRegionsChange([...selectedRegions, regionName]);
      onCitiesChange([...selectedCities, ...regionCities.filter(c => !selectedCities.includes(c))]);
      // توسيع المنطقة تلقائياً
      if (!expandedRegions.includes(regionName)) {
        setExpandedRegions(prev => [...prev, regionName]);
      }
    }
  }, [selectedRegions, selectedCities, onRegionsChange, onCitiesChange, expandedRegions]);

  const handleCityToggle = useCallback((cityName: string, regionName: string) => {
    const regionCities = getCitiesForRegion(regionName).map(c => c.name);
    const isSelected = selectedCities.includes(cityName);
    
    if (isSelected) {
      const newSelectedCities = selectedCities.filter(c => c !== cityName);
      onCitiesChange(newSelectedCities);
      
      // إذا لم تعد هناك أي مدينة مختارة من هذه المنطقة، أزل المنطقة أيضاً
      const hasOtherCitiesFromRegion = regionCities.some(c => newSelectedCities.includes(c));
      if (!hasOtherCitiesFromRegion) {
        onRegionsChange(selectedRegions.filter(r => r !== regionName));
      }
    } else {
      onCitiesChange([...selectedCities, cityName]);
      
      // إضافة المنطقة إذا لم تكن مضافة
      if (!selectedRegions.includes(regionName)) {
        onRegionsChange([...selectedRegions, regionName]);
      }
    }
  }, [selectedCities, selectedRegions, onCitiesChange, onRegionsChange]);

  const removeCity = useCallback((cityName: string) => {
    const newSelectedCities = selectedCities.filter(c => c !== cityName);
    onCitiesChange(newSelectedCities);
    
    // تحقق إذا كانت هذه آخر مدينة في منطقتها
    const city = saudiCities.find(c => c.name === cityName);
    if (city) {
      const regionCities = getCitiesForRegion(city.region).map(c => c.name);
      const hasOtherCitiesFromRegion = regionCities.some(c => newSelectedCities.includes(c));
      if (!hasOtherCitiesFromRegion) {
        onRegionsChange(selectedRegions.filter(r => r !== city.region));
      }
    }
  }, [selectedCities, selectedRegions, onCitiesChange, onRegionsChange]);

  const selectedCount = selectedCities.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {i18n.language === "en" ? "Service Areas" : "مناطق الخدمة"}
        </span>
        {selectedCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedCount} {i18n.language === "en" ? "cities" : "مدينة"}
          </Badge>
        )}
      </div>

      {/* Selected Cities Tags */}
      {selectedCities.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 bg-muted/50 rounded-lg max-h-20 overflow-y-auto">
          {selectedCities.slice(0, 8).map(cityName => {
            const city = saudiCities.find(c => c.name === cityName);
            return (
              <Badge key={cityName} variant="outline" className="gap-1 text-xs">
                {city ? getCityName(city, i18n.language) : cityName}
                <button
                  type="button"
                  onClick={() => removeCity(cityName)}
                  disabled={disabled}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {selectedCities.length > 8 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedCities.length - 8}
            </Badge>
          )}
        </div>
      )}

      {/* Regions List */}
      <div className="border rounded-lg max-h-60 overflow-y-auto">
        {saudiRegions.map(region => {
          const regionCities = getCitiesForRegion(region.name);
          const regionCityNames = regionCities.map(c => c.name);
          const isRegionSelected = selectedRegions.includes(region.name);
          const selectedCitiesCount = regionCityNames.filter(c => selectedCities.includes(c)).length;
          const isExpanded = expandedRegions.includes(region.name);
          const allCitiesSelected = selectedCitiesCount === regionCities.length && regionCities.length > 0;

          return (
            <Collapsible
              key={region.name}
              open={isExpanded}
              onOpenChange={() => toggleRegionExpand(region.name)}
            >
              <div className="border-b last:border-b-0">
                <div className="flex items-center gap-2 p-2 hover:bg-muted/50">
                  <Checkbox
                    id={`region-${region.name}`}
                    checked={allCitiesSelected}
                    onCheckedChange={() => handleRegionToggle(region.name)}
                    disabled={disabled}
                  />
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-between text-sm font-medium text-start"
                      disabled={disabled}
                    >
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {getRegionName(region, i18n.language)}
                        {selectedCitiesCount > 0 && (
                          <Badge variant="secondary" className="text-xs h-5 px-1.5">
                            {selectedCitiesCount}/{regionCities.length}
                          </Badge>
                        )}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <div className="grid grid-cols-2 gap-1 px-6 pb-2">
                    {regionCities.map(city => (
                      <div key={city.name} className="flex items-center gap-2">
                        <Checkbox
                          id={`city-${city.name}`}
                          checked={selectedCities.includes(city.name)}
                          onCheckedChange={() => handleCityToggle(city.name, region.name)}
                          disabled={disabled}
                        />
                        <label
                          htmlFor={`city-${city.name}`}
                          className="text-xs cursor-pointer"
                        >
                          {getCityName(city, i18n.language)}
                        </label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {i18n.language === "en" 
          ? "Select all regions and cities you can deliver to"
          : "اختر جميع المناطق والمدن التي تستطيع التوصيل إليها"
        }
      </p>
    </div>
  );
};

export default ServiceAreasSelector;
