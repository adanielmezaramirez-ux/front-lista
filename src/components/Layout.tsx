import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import SidebarResponsive from './SidebarResponsive';
import Navbar from './Navbar';
import { List } from 'react-bootstrap-icons';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <button 
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <List size={24} />
      </button>

      <SidebarResponsive 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className={`main-content ${sidebarOpen && isMobile ? 'expanded' : ''}`}>
        <Navbar />
        <Container className="mt-4">
          {children}
        </Container>
      </div>
    </>
  );
};

export default Layout;