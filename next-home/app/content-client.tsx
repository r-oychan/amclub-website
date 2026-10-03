"use client";
import AboutPage, { type AboutInitialData } from '../../frontend/src/pages/AboutPage';
import VenueDetailPage, { type VenueData } from '../../frontend/src/pages/VenueDetailPage';
export function AboutContent({ data }: { data: AboutInitialData }) { return <AboutPage initialData={data} />; }
export function DiningContent({ venue }: { venue: VenueData }) { return <VenueDetailPage section="dining" initialSlug={venue.slug} initialVenue={venue} />; }
