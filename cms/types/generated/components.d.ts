import type { Schema, Struct } from '@strapi/strapi';

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
    variant: Schema.Attribute.Enumeration<['default', 'dark', 'accent']> &
      Schema.Attribute.DefaultTo<'default'>;
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
    heading: Schema.Attribute.String;
    items: Schema.Attribute.Relation<'oneToMany', 'api::faq-item.faq-item'>;
    label: Schema.Attribute.String;
  };
}

export interface BlocksFeatureGrid extends Struct.ComponentSchema {
  collectionName: 'components_blocks_feature_grids';
  info: {
    description: 'Grid of feature cards with icon, heading and description';
    displayName: 'Feature Grid';
    icon: 'apps';
  };
  attributes: {
    body: Schema.Attribute.Text;
    cta: Schema.Attribute.Component<'shared.link', false>;
    features: Schema.Attribute.Component<'shared.feature-item', true>;
    heading: Schema.Attribute.String;
    label: Schema.Attribute.String;
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
    variant: Schema.Attribute.Enumeration<['full', 'compact']> &
      Schema.Attribute.DefaultTo<'full'>;
  };
}

export interface BlocksStatsCounter extends Struct.ComponentSchema {
  collectionName: 'components_blocks_stats_counters';
  info: {
    description: 'Section with stat counters';
    displayName: 'Stats Counter';
    icon: 'chartBubble';
  };
  attributes: {
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
    heading: Schema.Attribute.String;
    label: Schema.Attribute.String;
    tabs: Schema.Attribute.Component<'shared.link', true>;
  };
}

export interface BlocksTeamGrid extends Struct.ComponentSchema {
  collectionName: 'components_blocks_team_grids';
  info: {
    description: 'Grid of team/committee members';
    displayName: 'Team Grid';
    icon: 'user';
  };
  attributes: {
    heading: Schema.Attribute.String;
    members: Schema.Attribute.Relation<
      'oneToMany',
      'api::committee-member.committee-member'
    >;
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
    body: Schema.Attribute.Blocks;
    cta: Schema.Attribute.Component<'shared.link', false>;
    heading: Schema.Attribute.String;
    label: Schema.Attribute.String;
  };
}

export interface SharedFeatureItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_feature_items';
  info: {
    description: 'Feature with heading and description';
    displayName: 'Feature Item';
    icon: 'star';
  };
  attributes: {
    description: Schema.Attribute.Text;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    icon: Schema.Attribute.Media<'images'>;
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
    subtitle: Schema.Attribute.Text;
    subtitleColor: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'#FFFFFF'>;
    subtitleLink: Schema.Attribute.String;
    title: Schema.Attribute.String;
    titleColor: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#FFFFFF'>;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    description: 'Button or CTA link';
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blocks.card-grid': BlocksCardGrid;
      'blocks.cta-banner': BlocksCtaBanner;
      'blocks.event-listing': BlocksEventListing;
      'blocks.faq-section': BlocksFaqSection;
      'blocks.feature-grid': BlocksFeatureGrid;
      'blocks.hero': BlocksHero;
      'blocks.stats-counter': BlocksStatsCounter;
      'blocks.tabs-section': BlocksTabsSection;
      'blocks.team-grid': BlocksTeamGrid;
      'blocks.testimonial-slider': BlocksTestimonialSlider;
      'blocks.text-block': BlocksTextBlock;
      'shared.feature-item': SharedFeatureItem;
      'shared.footer-column': SharedFooterColumn;
      'shared.hero-slide': SharedHeroSlide;
      'shared.link': SharedLink;
      'shared.nav-column': SharedNavColumn;
      'shared.nav-dropdown': SharedNavDropdown;
      'shared.nav-item': SharedNavItem;
      'shared.seo': SharedSeo;
      'shared.stat-item': SharedStatItem;
    }
  }
}
