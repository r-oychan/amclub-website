// Type definitions for Contact Us page content. The runtime data that used to
// live here has moved to the `contact-us-page` Strapi single type; pages fetch
// it via fetchAPI('/contact-us-page') and the CMS is the source of truth.

export interface ContactInfo {
  address: string[];
  operatingHours: string[];
  phone: string;
  email: string;
  mapEmbedSrc: string;
}

export interface OutletScheduleRow {
  dayRange: string;
  time: string;
  lastOrder?: string;
}

export interface OutletScheduleBlock {
  subtitle?: string;
  rows: OutletScheduleRow[];
}

export interface OutletCard {
  name: string;
  blocks: OutletScheduleBlock[];
}

export interface OutletGroup {
  id: string;
  label: string;
  cards: OutletCard[];
}
