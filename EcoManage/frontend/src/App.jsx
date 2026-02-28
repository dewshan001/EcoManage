import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import Schedule from './pages/Schedule/Schedule';
import Contact from './pages/Contact/Contact';
import About from './pages/About/About';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import VehicleManagement from './pages/VehicleManagement/VehicleManagement';
import Reports from './pages/Reports/Reports';

const Navigation = () => {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const lastScrollY = React.useRef(0);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            setScrolled(currentScrollY > 50);

            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setVisible(false);
            } else {
                setVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isVehicles = location.pathname === '/vehicles';

    const navClass = scrolled && !isVehicles ? 'glass-nav-active' : 'glass';

    const linkStyle = (path) => ({
        color: location.pathname === path ? 'var(--primary-color)' : 'var(--text-dark)',
        textDecoration: 'none',
        fontWeight: location.pathname === path ? '600' : '400',
        transition: 'color 0.2s',
    });

    return (
        <nav className={navClass} style={{
            position: 'fixed',
            top: isVehicles ? '0' : (visible ? '20px' : '-100px'),
            left: '50%',
            transform: 'translateX(-50%)',
            width: isVehicles ? '100%' : 'calc(100% - 40px)',
            maxWidth: isVehicles ? 'none' : '1280px',
            zIndex: 1000,
            padding: isVehicles ? '14px 40px' : (scrolled ? '12px 32px' : '20px 32px'),
            borderRadius: isVehicles ? '0' : '24px',
            background: isVehicles ? 'rgba(255, 255, 255, 0.95)' : undefined,
            backdropFilter: isVehicles ? 'blur(10px)' : undefined,
            borderBottom: isVehicles ? '1px solid rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
            {/* 
        Modified to a 3-column grid layout for perfectly centered navigation
        Left: Logo
        Center: Links
        Right: Empty or Call to Action (balances logo)
      */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px' }}>
                    {/* Animated Logo Icon */}
                    <div className="logo-icon-container" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(16, 185, 129, 0.2))',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}>
                        <svg
                            className="spin-slow"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--primary-color)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                    </div>

                    <h1 style={{
                        fontSize: '1.6rem',
                        fontWeight: '800',
                        color: 'var(--text-dark)',
                        letterSpacing: '-1px',
                        display: 'flex',
                        alignItems: 'baseline',
                        margin: 0
                    }}>
                        Eco<span style={{ color: 'var(--primary-color)' }}>Manage.</span>
                    </h1>
                </div>

                {/* Centered Navigation Links */}
                <div style={{ display: 'flex', gap: '32px', justifyContent: 'center' }}>
                    <Link to="/" style={linkStyle('/')}>Home</Link>
                    <Link to="/reports" style={linkStyle('/reports')}>Reports</Link>
                    <Link to="/dashboard" style={linkStyle('/dashboard')}>Dashboard</Link>
                    <Link to="/schedule" style={linkStyle('/schedule')}>Schedule</Link>
                    <Link to="/vehicles" style={linkStyle('/vehicles')}>Vehicles</Link>
                    <Link to="/about" style={linkStyle('/about')}>About</Link>
                    <Link to="/contact" style={linkStyle('/contact')}>Contact</Link>
                </div>

                {/* Right Aligned Login Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Link to="/login" style={{
                        background: 'var(--primary-color)',
                        color: 'white',
                        textDecoration: 'none',
                        padding: '8px 24px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'var(--transition-fast)'
                    }}
                        onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = 'none';
                            e.target.style.boxShadow = 'var(--shadow-sm)';
                        }}
                    >Sign In</Link>
                </div>
            </div>
        </nav>
    );
};

const LayoutWrapper = () => {
    const location = useLocation();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navigation />
            {/* paddingTop ensures content isn't hidden under fixed nav */}
            <main style={{
                flex: 1,
                paddingTop: location.pathname === '/vehicles' ? '0' : '72px',
                height: location.pathname === '/vehicles' ? '100vh' : 'auto',
                overflow: location.pathname === '/vehicles' ? 'hidden' : 'visible',
                msOverflowStyle: location.pathname === '/' ? 'none' : 'auto',
                scrollbarWidth: location.pathname === '/' ? 'none' : 'auto'
            }}>
                <style>
                    {location.pathname === '/' && `
                            main::-webkit-scrollbar {
                                display: none;
                            }
                        `}
                </style>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/vehicles" element={<VehicleManagement />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Routes>
            </main>
        </div>
    );
};

function App() {
    return (
        <Router>
            <LayoutWrapper />
        </Router>
    );
}

export default App;
