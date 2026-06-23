import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import PortfolioPage from './pages/PortfolioPage.jsx';
import PortfolioDemoPage from './pages/PortfolioDemoPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import CRMPage from './pages/CRMPage.jsx';

const pages = {
  '/': HomePage,
  '/services': ServicesPage,
  '/portfolio': PortfolioPage,
  '/about': AboutPage,
  '/contact': ContactPage
};

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const demoMatch = path.match(/^\/portfolio\/([^/]+)$/);
  const isCRM = path.startsWith('/crm') || window.location.hostname.startsWith('crm.');
  const Page = demoMatch ? PortfolioDemoPage : pages[path] || HomePage;

  useEffect(() => {
    const handleNavigation = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  if (isCRM) {
    return <CRMPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-ink antialiased">
      <Header currentPath={path} />
      <main>
        <Page slug={demoMatch?.[1]} />
      </main>
      <Footer />
    </div>
  );
}
