"use client";

import dynamic from 'next/dynamic';
import { Header } from '../../frontend/src/components/layout/Header';
import { Footer } from '../../frontend/src/components/layout/Footer';
import { HomeView } from '../../frontend/src/pages/home-view';
import { Analytics } from '../../frontend/src/components/shared/Analytics';
import { transformHeader, type StrapiHeader } from '../../frontend/src/hooks/useHeaderData';
import { transformFooter, type StrapiFooter } from '../../frontend/src/hooks/useFooterData';
import type { StrapiHomePage, StrapiEvent } from '../../frontend/src/lib/home-types';

const ChatbotWidget = dynamic(() => import('../../frontend/src/components/shared/ChatbotWidget').then((m) => m.ChatbotWidget), { ssr: false });

export function HomeClient({ home, events, header, footer, preview }: {
  home: StrapiHomePage; events: StrapiEvent[]; header: StrapiHeader; footer: StrapiFooter; preview: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header initialData={transformHeader(header)} />
      <main className="flex-1"><HomeView data={home} events={events} /></main>
      <Footer initialData={transformFooter(footer)} />
      {!preview && <Analytics />}
      {!preview && <ChatbotWidget />}
    </div>
  );
}
