"use client";

import dynamic from 'next/dynamic';
import { Header } from '../../frontend/src/components/layout/Header';
import { Footer } from '../../frontend/src/components/layout/Footer';
import { Analytics } from '../../frontend/src/components/shared/Analytics';
import { transformHeader, type StrapiHeader } from '../../frontend/src/hooks/useHeaderData';
import { transformFooter, type StrapiFooter } from '../../frontend/src/hooks/useFooterData';
import { SiteCopyContext, type SiteCopy } from '../../frontend/src/hooks/useSiteCopy';
import type { ReactNode } from 'react';

const ChatbotWidget = dynamic(() => import('../../frontend/src/components/shared/ChatbotWidget').then((m) => m.ChatbotWidget), { ssr: false });

export function SiteShell({ children, header, footer, preview, copy }: { copy?: Partial<SiteCopy>; children: ReactNode; header: StrapiHeader; footer: StrapiFooter; preview: boolean }) {
  return (
    <SiteCopyContext.Provider value={copy}><div className="min-h-screen flex flex-col">
      <Header initialData={transformHeader(header)} />
      <main className="flex-1">{children}</main>
      <Footer initialData={transformFooter(footer)} />
      {!preview && <Analytics />}
      {!preview && <ChatbotWidget />}
    </div></SiteCopyContext.Provider>
  );
}
