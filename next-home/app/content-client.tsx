"use client";
import AboutPage, { type AboutInitialData } from '../../frontend/src/pages/AboutPage';
export function AboutContent({ data }: { data: AboutInitialData }) { return <AboutPage initialData={data} />; }
