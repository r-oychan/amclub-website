"use client";
import { SiteShell } from "./site-shell";
import { HomeView } from "../../frontend/src/pages/home-view";
import type { StrapiHomePage, StrapiEvent } from "../../frontend/src/lib/home-types";
import type { StrapiHeader } from "../../frontend/src/hooks/useHeaderData";
import type { StrapiFooter } from "../../frontend/src/hooks/useFooterData";
export function HomeClient({ home, events, ...shell }: { home: StrapiHomePage; events: StrapiEvent[]; header: StrapiHeader; footer: StrapiFooter; preview: boolean }) { return <SiteShell {...shell}><HomeView data={home} events={events} /></SiteShell>; }
