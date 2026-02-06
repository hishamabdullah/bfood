export type UserType = "restaurant" | "supplier";

export interface FormData {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessNameEn: string;
  password: string;
  region: string;
  city: string;
}

export interface DocumentUrls {
  commercialRegistrationUrl?: string;
  licenseUrl?: string;
  taxCertificateUrl?: string;
  nationalAddressUrl?: string;
}

export interface RegistrationState {
  userType: UserType;
  formData: FormData;
  selectedCategories: string[];
  serviceRegions: string[];
  serviceCities: string[];
  documentUrls: DocumentUrls;
}

export const initialFormData: FormData = {
  name: "",
  email: "",
  phone: "",
  businessName: "",
  businessNameEn: "",
  password: "",
  region: "",
  city: "",
};

export const TOTAL_STEPS = 4;
