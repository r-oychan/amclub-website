import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksAboutSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_about_sections';
  info: {
    description: 'Page-anchored about section with stats, fun fact, image collage, and CTA';
    displayName: 'About Section';
    icon: 'information';
  };
  attributes: {
    cta: Schema.Attribute.Component<'shared.link', false>;
    funFactBody: Schema.Attribute.Text;
    funFactIntro: Schema.Attribute.String;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    images: Schema.Attribute.Media<'images', true>;
    label: Schema.Attribute.String;
    stats: Schema.Attribute.Component<'shared.stat-item', true>;
  };
}

export interface BlocksAwardsGrid extends Struct.ComponentSchema {
  collectionName: 'components_blocks_awards_grids';
  info: {
    description: 'Grid of awards / accolades / certifications';
    displayName: 'Awards Grid';
    icon: 'medal';
  };
  attributes: {
    heading: Schema.Attribute.String;
    items: Schema.Attribute.Component<'shared.award-item', true>;
  };
}

export interface BlocksCardGrid extends Struct.ComponentSchema {
  collectionName: 'components_blocks_card_grids';
  info: {
    description: 'Grid of cards linking to collection items or external pages';
    displayName: 'Card Grid';
    icon: 'grid';
  };
  attributes: {
    cards: Schema.Attribute.Component<'shared.feature-item', true>;
    cta: Schema.Attribute.Component<'shared.link', false>;
    dark: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    heading: Schema.Attribute.String;
    label: Schema.Attribute.String;
    subheading: Schema.Attribute.Text;
  };
}

export interface BlocksCtaBanner extends Struct.ComponentSchema {
  collectionName: 'components_blocks_cta_banners';
  info: {
    description: 'Call to action banner with heading, body, and buttons';
    displayName: 'CTA Banner';
    icon: 'cursor';
  };
  attributes: {
    body: Schema.Attribute.Text;
    ctas: Schema.Attribute.Component<'shared.link', true>;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String;
    variant: Schema.Attribute.Enumeration<
      ['default', 'light', 'dark', 'accent']
    > &
      Schema.Attribute.DefaultTo<'default'>;
  };
}

export interface BlocksDistinctiveEventSpaces extends Struct.ComponentSchema {
  collectionName: 'components_blocks_distinctive_event_spaces';
  info: {
    description: 'Section listing curated venues with capacity';
    displayName: 'Distinctive Event Spaces';
    icon: 'layer';
  };
  attributes: {
    heading: Schema.Attribute.String;
    items: Schema.Attribute.Component<'shared.venue-row', true>;
    panelBgColor: Schema.Attribute.String;
    subheading: Schema.Attribute.Text;
  };
}

export interface BlocksEventListing extends Struct.ComponentSchema {
  collectionName: 'components_blocks_event_listings';
  info: {
    description: 'Section displaying events from the Event collection';
    displayName: 'Event Listing';
    icon: 'calendar';
  };
  attributes: {
    cta: Schema.Attribute.Component<'shared.link', false>;
    filterByCategory: Schema.Attribute.Relation<
      'oneToOne',
      'api::event-category.event-category'
    >;
    heading: Schema.Attribute.String;
    label: Schema.Attribute.String;
    maxItems: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<9>;
  };
}

export interface BlocksFaqSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_faq_sections';
  info: {
    description: 'FAQ accordion section';
    displayName: 'FAQ Section';
    icon: 'question';
  };
  attributes: {
    ctas: Schema.Attribute.Component<'shared.link', true>;
    dark: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    heading: Schema.Attribute.String;
    items: Schema.Attribute.Relation<'oneToMany', 'api::faq-item.faq-item'>;
    label: Schema.Attribute.String;
  };
}

export interface BlocksFeatureGrid extends Struct.ComponentSchema {
  collectionName: 'components_blocks_feature_grids';
  info: {
    description: 'Grid of feature cards (with image) OR a heading-with-bulleted-list and aside image';
    displayName: 'Feature Grid';
    icon: 'apps';
  };
  attributes: {
    asideImage: Schema.Attribute.Media<'images'>;
    asideImagePosition: Schema.Attribute.Enumeration<['left', 'right']> &
      Schema.Attribute.DefaultTo<'left'>;
    body: Schema.Attribute.Text;
    centered: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    cta: Schema.Attribute.Component<'shared.link', false>;
    dark: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    features: Schema.Attribute.Component<'shared.feature-item', true>;
    heading: Schema.Attribute.String;
    label: Schema.Attribute.String;
    listItems: Schema.Attribute.JSON;
    subheading: Schema.Attribute.String;
  };
}

export interface BlocksGovernance extends Struct.ComponentSchema {
  collectionName: 'components_blocks_governances';
  info: {
    description: 'Governance section with main copy and a sidebar of links';
    displayName: 'Governance';
    icon: 'shield';
  };
  attributes: {
    body: Schema.Attribute.Text;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    links: Schema.Attribute.Component<'shared.link', true>;
    sidebarBody: Schema.Attribute.Text;
    sidebarHeading: Schema.Attribute.String;
  };
}

export interface BlocksHeritageTimeline extends Struct.ComponentSchema {
  collectionName: 'components_blocks_heritage_timelines';
  info: {
    description: 'Heading + body with a year-by-year slideshow';
    displayName: 'Heritage Timeline';
    icon: 'clock';
  };
  attributes: {
    backgroundImage: Schema.Attribute.Media<'images'>;
    body: Schema.Attribute.Text;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    slides: Schema.Attribute.Component<'shared.timeline-slide', true>;
  };
}

export interface BlocksHero extends Struct.ComponentSchema {
  collectionName: 'components_blocks_heroes';
  info: {
    description: 'Hero banner with heading, subheading, background image and CTA';
    displayName: 'Hero';
    icon: 'picture';
  };
  attributes: {
    autoPlayInterval: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<5000>;
    backgroundImage: Schema.Attribute.Media<'images'>;
    cta: Schema.Attribute.Component<'shared.link', false>;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    slides: Schema.Attribute.Component<'shared.hero-slide', true>;
    subheading: Schema.Attribute.Text;
    subtitlePosition: Schema.Attribute.Enumeration<
      ['bottom-left', 'bottom-right', 'middle-left', 'middle-right']
    > &
      Schema.Attribute.DefaultTo<'bottom-right'>;
    titlePosition: Schema.Attribute.Enumeration<
      ['bottom-left', 'bottom-right', 'middle-left', 'middle-right']
    > &
      Schema.Attribute.DefaultTo<'bottom-left'>;
    variant: Schema.Attribute.Enumeration<['full', 'compact']> &
      Schema.Attribute.DefaultTo<'full'>;
  };
}

export interface BlocksManagementSlider extends Struct.ComponentSchema {
  collectionName: 'components_blocks_management_sliders';
  info: {
    description: 'Heading and watermark \u2014 members fetched separately by memberType';
    displayName: 'Management Slider';
    icon: 'user';
  };
  attributes: {
    filterByType: Schema.Attribute.Enumeration<
      ['general-committee', 'management']
    > &
      Schema.Attribute.DefaultTo<'management'>;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    watermark: Schema.Attribute.Media<'images'>;
  };
}

export interface BlocksOffsiteCateringServices extends Struct.ComponentSchema {
  collectionName: 'components_blocks_offsite_catering_services';
  info: {
    description: 'Off-site catering with pillars + sub-banner';
    displayName: 'Off-site Catering Services';
    icon: 'shoppingCart';
  };
  attributes: {
    body: Schema.Attribute.Text;
    ctas: Schema.Attribute.Component<'shared.link', true>;
    heading: Schema.Attribute.String;
    pillars: Schema.Attribute.Component<'shared.catering-pillar', true>;
    subBanner: Schema.Attribute.Component<'shared.catering-sub-banner', false>;
  };
}

export interface BlocksOverlaySection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_overlay_sections';
  info: {
    description: 'Image + overlay text panel with positioning + theming';
    displayName: 'Overlay Section';
    icon: 'layer';
  };
  attributes: {
    ctas: Schema.Attribute.Component<'shared.link', true>;
    description: Schema.Attribute.Text;
    heading: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    imageAlt: Schema.Attribute.String;
    logo: Schema.Attribute.Media<'images'>;
    textBgColor: Schema.Attribute.String;
    textBgImage: Schema.Attribute.Media<'images'>;
    textPosition: Schema.Attribute.Enumeration<['left', 'right']> &
      Schema.Attribute.DefaultTo<'left'>;
    textTheme: Schema.Attribute.Enumeration<['light', 'dark']> &
      Schema.Attribute.DefaultTo<'light'>;
    textVerticalAlign: Schema.Attribute.Enumeration<
      ['start', 'center', 'end']
    > &
      Schema.Attribute.DefaultTo<'center'>;
  };
}

export interface BlocksPartnerOrganizations extends Struct.ComponentSchema {
  collectionName: 'components_blocks_partner_organizations';
  info: {
    description: 'Sections of partner / sponsor logos';
    displayName: 'Partner Organizations';
    icon: 'handshake';
  };
  attributes: {
    groups: Schema.Attribute.Component<'shared.partner-group', true>;
    heading: Schema.Attribute.String;
  };
}

export interface BlocksPrivateEventPackages extends Struct.ComponentSchema {
  collectionName: 'components_blocks_private_event_packages';
  info: {
    description: 'Section showing wedding/corporate/parties packages';
    displayName: 'Private Event Packages';
    icon: 'calendar';
  };
  attributes: {
    enquireCta: Schema.Attribute.Component<'shared.link', false>;
    heading: Schema.Attribute.String;
    items: Schema.Attribute.Component<'shared.event-package-item', true>;
    subheading: Schema.Attribute.Text;
  };
}

export interface BlocksStatsCounter extends Struct.ComponentSchema {
  collectionName: 'components_blocks_stats_counters';
  info: {
    description: 'Section with optional heading + label and a row of stat counters';
    displayName: 'Stats Counter';
    icon: 'chartBubble';
  };
  attributes: {
    heading: Schema.Attribute.String;
    label: Schema.Attribute.String;
    stats: Schema.Attribute.Component<'shared.stat-item', true>;
  };
}

export interface BlocksTabsSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_tabs_sections';
  info: {
    description: 'Tabbed content section with image cards';
    displayName: 'Tabs Section';
    icon: 'layer';
  };
  attributes: {
    dark: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    heading: Schema.Attribute.String;
    label: Schema.Attribute.String;
    tabs: Schema.Attribute.Component<'shared.tab-item', true>;
  };
}

export interface BlocksTeamGrid extends Struct.ComponentSchema {
  collectionName: 'components_blocks_team_grids';
  info: {
    description: 'Grid of team / committee members. Members fetched separately by memberType.';
    displayName: 'Team Grid';
    icon: 'user';
  };
  attributes: {
    filterByType: Schema.Attribute.Enumeration<
      ['general-committee', 'management']
    > &
      Schema.Attribute.DefaultTo<'general-committee'>;
    heading: Schema.Attribute.String;
    variant: Schema.Attribute.Enumeration<['light', 'dark']> &
      Schema.Attribute.DefaultTo<'light'>;
  };
}

export interface BlocksTestimonialSlider extends Struct.ComponentSchema {
  collectionName: 'components_blocks_testimonial_sliders';
  info: {
    description: 'Carousel of member testimonials';
    displayName: 'Testimonial Slider';
    icon: 'quote';
  };
  attributes: {
    cta: Schema.Attribute.Component<'shared.link', false>;
    dark: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    heading: Schema.Attribute.String;
    label: Schema.Attribute.String;
    testimonials: Schema.Attribute.Relation<
      'oneToMany',
      'api::testimonial.testimonial'
    >;
  };
}

export interface BlocksTextBlock extends Struct.ComponentSchema {
  collectionName: 'components_blocks_text_blocks';
  info: {
    description: 'Rich text content section with optional label and CTA';
    displayName: 'Text Block';
    icon: 'file';
  };
  attributes: {
    body: Schema.Attribute.Text;
    cta: Schema.Attribute.Component<'shared.link', false>;
    heading: Schema.Attribute.String;
    label: Schema.Attribute.String;
  };
}

export interface BlocksThreeColGrid extends Struct.ComponentSchema {
  collectionName: 'components_blocks_three_col_grids';
  info: {
    description: 'Heading + 2 or 3 column card grid';
    displayName: 'Three Col Grid';
    icon: 'grid';
  };
  attributes: {
    columns: Schema.Attribute.Enumeration<['2', '3']> &
      Schema.Attribute.DefaultTo<'3'>;
    heading: Schema.Attribute.String;
    items: Schema.Attribute.Component<'shared.three-col-item', true>;
    subheading: Schema.Attribute.Text;
    variant: Schema.Attribute.Enumeration<['centered', 'left']> &
      Schema.Attribute.DefaultTo<'centered'>;
  };
}

export interface BlocksVisionMission extends Struct.ComponentSchema {
  collectionName: 'components_blocks_vision_missions';
  info: {
    description: 'Side-by-side Our Vision / Our Mission with an image';
    displayName: 'Vision / Mission';
    icon: 'compass';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    imagePosition: Schema.Attribute.Enumeration<['left', 'right']> &
      Schema.Attribute.DefaultTo<'left'>;
    mission: Schema.Attribute.Text;
    vision: Schema.Attribute.Text;
  };
}

export interface SharedAwardItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_award_items';
  info: {
    description: 'Award / certification with title, issuer and image';
    displayName: 'Award Item';
    icon: 'medal';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    issuer: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedCateringPillar extends Struct.ComponentSchema {
  collectionName: 'components_shared_catering_pillars';
  info: {
    description: 'One pillar in the off-site catering panel';
    displayName: 'Catering Pillar';
    icon: 'rectangle';
  };
  attributes: {
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    items: Schema.Attribute.JSON;
    subheading: Schema.Attribute.String;
  };
}

export interface SharedCateringSubBanner extends Struct.ComponentSchema {
  collectionName: 'components_shared_catering_sub_banners';
  info: {
    description: 'Sub-banner inside the off-site catering section';
    displayName: 'Catering Sub-Banner';
    icon: 'rectangle';
  };
  attributes: {
    body: Schema.Attribute.Text;
    cta: Schema.Attribute.Component<'shared.link', false>;
    heading: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedEventPackageItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_event_package_items';
  info: {
    description: 'Wedding/corporate/parties package card';
    displayName: 'Event Package Item';
    icon: 'rectangle';
  };
  attributes: {
    cta: Schema.Attribute.Component<'shared.link', false>;
    image: Schema.Attribute.Media<'images'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    serviceFeatures: Schema.Attribute.JSON;
    tagline: Schema.Attribute.String;
    venues: Schema.Attribute.JSON;
  };
}

export interface SharedFeatureItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_feature_items';
  info: {
    description: 'Feature with heading, description, and image';
    displayName: 'Feature Item';
    icon: 'star';
  };
  attributes: {
    cta: Schema.Attribute.Component<'shared.link', false>;
    description: Schema.Attribute.Text;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedFooterColumn extends Struct.ComponentSchema {
  collectionName: 'components_shared_footer_columns';
  info: {
    description: 'Footer link column';
    displayName: 'Footer Column';
    icon: 'layout';
  };
  attributes: {
    links: Schema.Attribute.Component<'shared.link', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedHeroSlide extends Struct.ComponentSchema {
  collectionName: 'components_shared_hero_slides';
  info: {
    displayName: 'Hero Slide';
    icon: 'picture';
  };
  attributes: {
    backgroundImage: Schema.Attribute.Media<'images'> &
      Schema.Attribute.Required;
    cta: Schema.Attribute.Component<'shared.link', false>;
    overlayDarken: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    subtitle: Schema.Attribute.Text;
    subtitleColor: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'#FFFFFF'>;
    subtitleLink: Schema.Attribute.String;
    subtitlePosition: Schema.Attribute.Enumeration<
      ['bottom-left', 'bottom-right', 'middle-left', 'middle-right']
    > &
      Schema.Attribute.DefaultTo<'bottom-right'>;
    title: Schema.Attribute.String;
    titleColor: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#FFFFFF'>;
    titlePosition: Schema.Attribute.Enumeration<
      ['bottom-left', 'bottom-right', 'middle-left', 'middle-right']
    > &
      Schema.Attribute.DefaultTo<'bottom-left'>;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    description: 'Button or CTA link with optional caption';
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
    bordered: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    caption: Schema.Attribute.String;
    href: Schema.Attribute.String;
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    variant: Schema.Attribute.Enumeration<
      ['primary', 'secondary', 'outline', 'text']
    > &
      Schema.Attribute.DefaultTo<'primary'>;
  };
}

export interface SharedNavColumn extends Struct.ComponentSchema {
  collectionName: 'components_shared_nav_columns';
  info: {
    displayName: 'Nav Column';
    icon: 'apps';
  };
  attributes: {
    heading: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    imageLink: Schema.Attribute.String;
    links: Schema.Attribute.Component<'shared.nav-item', true>;
  };
}

export interface SharedNavDropdown extends Struct.ComponentSchema {
  collectionName: 'components_shared_nav_dropdowns';
  info: {
    description: 'Navigation dropdown with optional columns';
    displayName: 'Nav Dropdown';
    icon: 'apps';
  };
  attributes: {
    columns: Schema.Attribute.Component<'shared.nav-column', true>;
    href: Schema.Attribute.String & Schema.Attribute.Required;
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedNavItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_nav_items';
  info: {
    description: 'Navigation menu item';
    displayName: 'Nav Item';
    icon: 'apps';
  };
  attributes: {
    href: Schema.Attribute.String & Schema.Attribute.Required;
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedPartnerGroup extends Struct.ComponentSchema {
  collectionName: 'components_shared_partner_groups';
  info: {
    description: 'Group of partner logos with optional sub-heading';
    displayName: 'Partner Group';
    icon: 'layer';
  };
  attributes: {
    heading: Schema.Attribute.String;
    logos: Schema.Attribute.Component<'shared.partner-logo', true>;
  };
}

export interface SharedPartnerLogo extends Struct.ComponentSchema {
  collectionName: 'components_shared_partner_logos';
  info: {
    description: 'Partner / sponsor logo with optional link';
    displayName: 'Partner Logo';
    icon: 'picture';
  };
  attributes: {
    href: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'SEO metadata for pages';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    canonicalURL: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaImage: Schema.Attribute.Media<'images'>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
  };
}

export interface SharedStatItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_stat_items';
  info: {
    description: 'A single stat with value and label';
    displayName: 'Stat Item';
    icon: 'chartBubble';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedTabItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_tab_items';
  info: {
    description: 'Single tab with label, link, and image';
    displayName: 'Tab Item';
    icon: 'layer';
  };
  attributes: {
    href: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedThreeColItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_three_col_items';
  info: {
    description: 'Card with image, heading, description and CTA';
    displayName: 'Three Col Item';
    icon: 'rectangle';
  };
  attributes: {
    accentColor: Schema.Attribute.String;
    cta: Schema.Attribute.Component<'shared.link', false>;
    description: Schema.Attribute.Text;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    imageAlt: Schema.Attribute.String;
  };
}

export interface SharedTimelineSlide extends Struct.ComponentSchema {
  collectionName: 'components_shared_timeline_slides';
  info: {
    description: 'A single year/body/image slide for the heritage timeline';
    displayName: 'Timeline Slide';
    icon: 'calendar';
  };
  attributes: {
    body: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images'>;
    year: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedVenueRow extends Struct.ComponentSchema {
  collectionName: 'components_shared_venue_rows';
  info: {
    description: 'Distinctive event-spaces venue row';
    displayName: 'Venue Row';
    icon: 'rectangle';
  };
  attributes: {
    capacity: Schema.Attribute.JSON;
    cta: Schema.Attribute.Component<'shared.link', false>;
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blocks.about-section': BlocksAboutSection;
      'blocks.awards-grid': BlocksAwardsGrid;
      'blocks.card-grid': BlocksCardGrid;
      'blocks.cta-banner': BlocksCtaBanner;
      'blocks.distinctive-event-spaces': BlocksDistinctiveEventSpaces;
      'blocks.event-listing': BlocksEventListing;
      'blocks.faq-section': BlocksFaqSection;
      'blocks.feature-grid': BlocksFeatureGrid;
      'blocks.governance': BlocksGovernance;
      'blocks.heritage-timeline': BlocksHeritageTimeline;
      'blocks.hero': BlocksHero;
      'blocks.management-slider': BlocksManagementSlider;
      'blocks.offsite-catering-services': BlocksOffsiteCateringServices;
      'blocks.overlay-section': BlocksOverlaySection;
      'blocks.partner-organizations': BlocksPartnerOrganizations;
      'blocks.private-event-packages': BlocksPrivateEventPackages;
      'blocks.stats-counter': BlocksStatsCounter;
      'blocks.tabs-section': BlocksTabsSection;
      'blocks.team-grid': BlocksTeamGrid;
      'blocks.testimonial-slider': BlocksTestimonialSlider;
      'blocks.text-block': BlocksTextBlock;
      'blocks.three-col-grid': BlocksThreeColGrid;
      'blocks.vision-mission': BlocksVisionMission;
      'shared.award-item': SharedAwardItem;
      'shared.catering-pillar': SharedCateringPillar;
      'shared.catering-sub-banner': SharedCateringSubBanner;
      'shared.event-package-item': SharedEventPackageItem;
      'shared.feature-item': SharedFeatureItem;
      'shared.footer-column': SharedFooterColumn;
      'shared.hero-slide': SharedHeroSlide;
      'shared.link': SharedLink;
      'shared.nav-column': SharedNavColumn;
      'shared.nav-dropdown': SharedNavDropdown;
      'shared.nav-item': SharedNavItem;
      'shared.partner-group': SharedPartnerGroup;
      'shared.partner-logo': SharedPartnerLogo;
      'shared.seo': SharedSeo;
      'shared.stat-item': SharedStatItem;
      'shared.tab-item': SharedTabItem;
      'shared.three-col-item': SharedThreeColItem;
      'shared.timeline-slide': SharedTimelineSlide;
      'shared.venue-row': SharedVenueRow;
    }
  }
}
