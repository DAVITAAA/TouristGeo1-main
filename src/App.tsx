import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Home from './pages/Home';
import Search from './pages/Search';
import WhyGeorgia from './pages/WhyGeorgia';
import Places from './pages/Places';
import Sights from './pages/Sights';
import AddTourWizard from './pages/AddTourWizard.tsx';
import Tours from './pages/Tours.tsx';
import Profile from './pages/Profile.tsx';
import TourDetail from './pages/TourDetail.tsx';
import Operator from './pages/Operator.tsx';
import Favorites from './pages/Favorites';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import { Language } from './translations';
import { getMe, User, Tour, removeToken } from './api';

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  });
  const [language, setLanguage] = useState<Language>('ka');
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    // Attempt to restore session on load
    getMe().then(loggedUser => {
      if (loggedUser) setUser(loggedUser);
    }).catch(console.error);

    // Handle initial state setup for browser history
    if (!window.history.state) {
      window.history.replaceState(
        { page: currentPage, tour: selectedTour },
        '',
        window.location.hash || window.location.pathname
      );
    }

    // Handle back/forward navigation
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.page) {
        if (state.page === 'tour-detail' && state.tour) {
          setSelectedTour(state.tour);
        } else if (state.page === 'operator' && state.operator) {
          setSelectedOperator(state.operator);
        }
        setCurrentPage(state.page);
      } else {
        const hash = window.location.hash.replace('#', '');
        setCurrentPage(hash || 'home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleLogout = async () => {
    removeToken();
    setUser(null);
    handleNavigate('home');
  };

  const handleNavigate = (page: string, data?: any) => {
    let tourData = null;
    let operatorData = null;
    
    if ((page === 'tour-detail' || page === 'edit-tour') && data) {
      setSelectedTour(data as Tour);
      tourData = data;
    } else if (page === 'operator' && data) {
      setSelectedOperator({ id: data.operator_id, name: data.operator_name });
      operatorData = { id: data.operator_id, name: data.operator_name };
    }

    // Only push to history if it's a new state transition
    if (page !== currentPage || ((page === 'tour-detail' || page === 'edit-tour') && tourData && selectedTour?.id !== tourData.id) || (page === 'operator' && operatorData && selectedOperator?.id !== operatorData.id)) {
      const pathSuffix = page === 'home' ? '' : `#${page}`;
      window.history.pushState(
        { page, tour: tourData, operator: operatorData },
        '',
        window.location.pathname + pathSuffix
      );
    }

    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home onNavigate={handleNavigate} language={language} />;
      case 'tours': return <Tours onNavigate={handleNavigate} language={language} />;
      case 'search': return <Search onNavigate={handleNavigate} language={language} />;
      case 'why-georgia': return <WhyGeorgia language={language} />;
      case 'places': return <Places language={language} />;
      case 'sights': return <Sights language={language} />;
      case 'add-tour': return user?.role === 'operator' ? <AddTourWizard onNavigate={handleNavigate} language={language} user={user} /> : <Home onNavigate={handleNavigate} language={language} />;
      case 'edit-tour': return selectedTour ? <AddTourWizard onNavigate={handleNavigate} language={language} user={user} tourToEdit={selectedTour} /> : <Home onNavigate={handleNavigate} language={language} />;
      case 'profile': return user ? <Profile onNavigate={handleNavigate} language={language} user={user} onUpdateUser={(u) => setUser({ ...user, ...u })} onLogout={handleLogout} /> : null;
      case 'tour-detail': return selectedTour ? <TourDetail tour={selectedTour} onNavigate={handleNavigate} language={language} user={user} /> : <Home onNavigate={handleNavigate} language={language} />;
      case 'operator': return <Operator onNavigate={handleNavigate} language={language} operator={selectedOperator} />;
      case 'favorites': return <Favorites onNavigate={handleNavigate} language={language} />;
      default: return <Home onNavigate={handleNavigate} language={language} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        onNavigate={handleNavigate}
        currentPage={currentPage}
        language={language}
        setLanguage={setLanguage}
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage + (selectedTour?.id || '') + (selectedOperator?.id || '')}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />

      {showAuthModal && (
        <AuthModal
          language={language}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u) => {
            setUser(u);
            setShowAuthModal(false);
            handleNavigate('home');
          }}
        />
      )}
    </div>
  );
}