import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ChatbotWidget } from './components/shared/ChatbotWidget';
import { ScrollToTop } from './components/shared/ScrollToTop';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import DiningPage from './pages/DiningPage';
import DiningPromotionsPage from './pages/DiningPromotionsPage';
import FitnessPage from './pages/FitnessPage';
import KidsPage from './pages/KidsPage';
import EventSpacesPage from './pages/EventSpacesPage';
import MembershipPage from './pages/MembershipPage';
import JoiningFeesPage from './pages/JoiningFeesPage';
import ReferralPage from './pages/ReferralPage';
import ReciprocalClubsPage from './pages/ReciprocalClubsPage';
import MembershipSingletonPage from './pages/MembershipSingletonPage';
import WhatsOnPage from './pages/WhatsOnPage';
import EventDetailPage from './pages/EventDetailPage';
import NewsPage from './pages/NewsPage';
import NewsArticlePage from './pages/NewsArticlePage';
import GalleryPage from './pages/GalleryPage';
import VenueDetailPage from './pages/VenueDetailPage';
import CoachDetailPage from './pages/CoachDetailPage';
import ContactUsPage from './pages/ContactUsPage';
import FaqPage from './pages/FaqPage';
import PrivacyStatementPage from './pages/PrivacyStatementPage';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/dining" element={<DiningPage />} />
            <Route path="/dining/dining-promotion" element={<DiningPromotionsPage />} />
            <Route path="/dining/:slug" element={<VenueDetailPage section="dining" />} />
            <Route path="/fitness" element={<FitnessPage />} />
            <Route path="/fitness/:slug" element={<VenueDetailPage section="fitness" />} />
            <Route path="/fitness/:slug/:subSlug" element={<VenueDetailPage section="fitness" />} />
            <Route path="/coaches/:section/:slug" element={<CoachDetailPage />} />
            <Route path="/kids" element={<KidsPage />} />
            <Route path="/kids/:slug" element={<VenueDetailPage section="kids" />} />
            <Route path="/event-spaces" element={<EventSpacesPage />} />
            <Route path="/event-spaces/:slug" element={<VenueDetailPage section="event-spaces" />} />
            <Route path="/membership" element={<MembershipPage />} />
            <Route path="/membership/joining-fees" element={<JoiningFeesPage />} />
            <Route path="/membership/referal" element={<ReferralPage />} />
            <Route path="/membership/reciprocal-clubs" element={<ReciprocalClubsPage />} />
            <Route
              path="/membership/start-application"
              element={<MembershipSingletonPage endpoint="/start-application-page" />}
            />
            <Route
              path="/membership/niche-group-membership"
              element={<MembershipSingletonPage endpoint="/niche-group-membership-page" />}
            />
            <Route
              path="/membership/advertise-with-us"
              element={<MembershipSingletonPage endpoint="/advertise-with-us-page" />}
            />
            <Route
              path="/membership/the-eagles-rewards-program"
              element={<Navigate to="/membership/niche-group-membership" replace />}
            />
            <Route
              path="/home-sub/advertise-with-us"
              element={<Navigate to="/membership/advertise-with-us" replace />}
            />
            <Route path="/membership/:slug" element={<VenueDetailPage section="membership" />} />
            <Route path="/whats-on" element={<WhatsOnPage />} />
            <Route path="/whats-on/:slug" element={<EventDetailPage />} />
            <Route path="/home-sub/news" element={<NewsPage />} />
            <Route path="/home-sub/club-news/:slug" element={<NewsArticlePage />} />
            <Route path="/home-sub/gallery" element={<GalleryPage />} />
            <Route path="/home-sub/contact-us" element={<ContactUsPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/privacy-statement" element={<PrivacyStatementPage />} />
            <Route path="/home-sub/:slug" element={<VenueDetailPage section="home-sub" />} />
          </Routes>
        </main>
        <Footer />
        <ChatbotWidget />
      </div>
    </BrowserRouter>
  );
}
