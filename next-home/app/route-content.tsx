"use client";
import dynamic from "next/dynamic";
import type { RouteData } from "../lib/routes";
const Dining = dynamic(() => import('../../frontend/src/pages/DiningPage'));
const DiningPromotions = dynamic(() => import('../../frontend/src/pages/DiningPromotionsPage'));
const Fitness = dynamic(() => import('../../frontend/src/pages/FitnessPage'));
const Kids = dynamic(() => import('../../frontend/src/pages/KidsPage'));
const EventSpaces = dynamic(() => import('../../frontend/src/pages/EventSpacesPage'));
const Membership = dynamic(() => import('../../frontend/src/pages/MembershipPage'));
const WhatsOn = dynamic(() => import('../../frontend/src/pages/WhatsOnPage'));
const News = dynamic(() => import('../../frontend/src/pages/NewsPage'));
const Gallery = dynamic(() => import('../../frontend/src/pages/GalleryPage'));
const ContactUs = dynamic(() => import('../../frontend/src/pages/ContactUsPage'));
const Faq = dynamic(() => import('../../frontend/src/pages/FaqPage'));
const PrivacyStatement = dynamic(() => import('../../frontend/src/pages/PrivacyStatementPage'));
const AdvertiseWithUs = dynamic(() => import('../../frontend/src/pages/AdvertiseWithUsPage'));
const ReciprocalClubs = dynamic(() => import('../../frontend/src/pages/ReciprocalClubsPage'));
const JoiningFees = dynamic(() => import('../../frontend/src/pages/JoiningFeesPage'));
const Referral = dynamic(() => import('../../frontend/src/pages/ReferralPage'));
const EventDetail = dynamic(() => import('../../frontend/src/pages/EventDetailPage'));
const NewsArticle = dynamic(() => import('../../frontend/src/pages/NewsArticlePage'));
const CoachDetail = dynamic(() => import('../../frontend/src/pages/CoachDetailPage'));
const VenueDetail = dynamic(() => import('../../frontend/src/pages/VenueDetailPage'));

export function RouteContent({ data }: { data: RouteData }) {
  switch (data.kind) {
    case 'Dining': return <Dining initialData={data.initialData} />;
    case 'DiningPromotions': return <DiningPromotions initialData={data.initialData} />;
    case 'Fitness': return <Fitness initialData={data.initialData} />;
    case 'Kids': return <Kids initialData={data.initialData} />;
    case 'EventSpaces': return <EventSpaces initialData={data.initialData} />;
    case 'Membership': return <Membership initialData={data.initialData} />;
    case 'WhatsOn': return <WhatsOn initialData={data.initialData} />;
    case 'News': return <News initialData={data.initialData} />;
    case 'Gallery': return <Gallery initialData={data.initialData} />;
    case 'ContactUs': return <ContactUs initialData={data.initialData} />;
    case 'Faq': return <Faq initialData={data.initialData} />;
    case 'PrivacyStatement': return <PrivacyStatement initialData={data.initialData} />;
    case 'AdvertiseWithUs': return <AdvertiseWithUs initialData={data.initialData} />;
    case 'ReciprocalClubs': return <ReciprocalClubs initialData={data.initialData} />;
    case 'JoiningFees': return <JoiningFees initialData={data.initialData} />;
    case 'Referral': return <Referral initialData={data.initialData} />;
    case 'EventDetail': return <EventDetail initialData={data.initialData} />;
    case 'NewsArticle': return <NewsArticle initialData={data.initialData} />;
    case 'CoachDetail': return <CoachDetail initialData={data.initialData} />;
    case 'VenueDetail': return <VenueDetail section={data.section} initialSlug={data.venue.slug} initialVenue={data.venue} />;
  }
}
