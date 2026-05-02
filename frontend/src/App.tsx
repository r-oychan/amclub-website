import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ChatbotWidget } from './components/shared/ChatbotWidget';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import DiningPage from './pages/DiningPage';
import FitnessPage from './pages/FitnessPage';
import KidsPage from './pages/KidsPage';
import EventSpacesPage from './pages/EventSpacesPage';
import MembershipPage from './pages/MembershipPage';
import WhatsOnPage from './pages/WhatsOnPage';
import NewsPage from './pages/NewsPage';
import GalleryPage from './pages/GalleryPage';
import VenueDetailPage from './pages/VenueDetailPage';
import ContactUsPage from './pages/ContactUsPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/dining" element={<DiningPage />} />
            <Route path="/dining/:slug" element={<VenueDetailPage section="dining" />} />
            <Route path="/fitness" element={<FitnessPage />} />
            <Route path="/fitness/:slug" element={<VenueDetailPage section="fitness" />} />
            <Route path="/kids" element={<KidsPage />} />
            <Route path="/kids/:slug" element={<VenueDetailPage section="kids" />} />
            <Route path="/event-spaces" element={<EventSpacesPage />} />
            <Route path="/event-spaces/:slug" element={<VenueDetailPage section="event-spaces" />} />
            <Route path="/membership" element={<MembershipPage />} />
            <Route path="/membership/:slug" element={<VenueDetailPage section="membership" />} />
            <Route path="/whats-on" element={<WhatsOnPage />} />
            <Route path="/home-sub/news" element={<NewsPage />} />
            <Route path="/home-sub/gallery" element={<GalleryPage />} />
            <Route path="/home-sub/contact-us" element={<ContactUsPage />} />
            <Route path="/home-sub/:slug" element={<VenueDetailPage section="home-sub" />} />
          </Routes>
        </main>
        <Footer />
        <ChatbotWidget />
      </div>
    </BrowserRouter>
  );
}
