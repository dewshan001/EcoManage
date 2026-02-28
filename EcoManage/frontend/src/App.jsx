import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import Schedule from './pages/Schedule/Schedule';
import Contact from './pages/Contact/Contact';
import About from './pages/About/About';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import RegisterManager from './pages/RegisterManager/RegisterManager';
import VehicleManagement from './pages/VehicleManagement/VehicleManagement';
import Workers from './pages/Workers/Workers';
import Reports from './pages/Reports/Reports';
import ReportReview from './pages/ReportReview/ReportReview';
import Billing from './pages/Billing/Billing';
import Settings from './pages/Settings/Settings';

const Navigation = () => {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const [user, setUser] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [modalPassword, setModalPassword] = useState('');
    const [modalError, setModalError] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const lastScrollY = React.useRef(0);
    const location = useLocation();
    const navigate = useNavigate();

    // Fetch user from localStorage on mount and when location changes
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from localStorage");
            }
        } else {
            setUser(null);
        }
    }, [location.pathname]);

    const handleSettingsClick = (e) => {
        e.preventDefault();
        setModalPassword('');
        setModalError('');
        setShowPasswordModal(true);
    };

    const handlePasswordConfirm = async (e) => {
        e.preventDefault();
        if (!modalPassword) { setModalError('Please enter your password.'); return; }
        setModalLoading(true);
        setModalError('');
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, password: modalPassword })
            });
            if (response.ok) {
                setShowPasswordModal(false);
                setModalPassword('');
                navigate('/settings');
            } else {
                setModalError('Incorrect password. Please try again.');
            }
        } catch {
            setModalError('Could not connect to server.');
        } finally {
            setModalLoading(false);
        }
    };

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

    const isDashboardLayout = location.pathname === '/vehicles' || location.pathname === '/workers' || location.pathname === '/register-manager';

    const navClass = scrolled && !isDashboardLayout ? 'glass-nav-active' : 'glass';

    const linkStyle = (path) => ({
        color: location.pathname === path ? 'var(--primary-color)' : 'var(--text-dark)',
        textDecoration: 'none',
        fontWeight: location.pathname === path ? '600' : '400',
        transition: 'color 0.2s',
    });

    return (
        <>
            <nav className={navClass} style={{
                position: 'fixed',
                top: isDashboardLayout ? '0' : (visible ? '20px' : '-100px'),
                left: '50%',
                transform: 'translateX(-50%)',
                width: isDashboardLayout ? '100%' : 'calc(100% - 40px)',
                maxWidth: isDashboardLayout ? 'none' : '1280px',
                zIndex: 1000,
                padding: isDashboardLayout ? '14px 40px' : (scrolled ? '12px 32px' : '20px 32px'),
                borderRadius: isDashboardLayout ? '0' : '24px',
                background: isDashboardLayout ? 'rgba(255, 255, 255, 0.95)' : undefined,
                backdropFilter: isDashboardLayout ? 'blur(10px)' : undefined,
                borderBottom: isDashboardLayout ? '1px solid rgba(0,0,0,0.08)' : 'none',
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

                        {/* Reports: hidden for Admins */}
                        {(!user || user.role !== 'Admin') && (
                            <Link to="/reports" style={linkStyle('/reports')}>Reports</Link>
                        )}

                        {/* Admin-only links */}
                        {(!user || user.role !== 'Resident') && (
                            <>
                                <Link to="/report-review" style={linkStyle('/report-review')}>Review & Tasks</Link>
                                <Link to="/vehicles" style={linkStyle('/vehicles')}>Vehicles</Link>
                                <Link to="/workers" style={linkStyle('/workers')}>Workers</Link>
                            </>
                        )}

                        {/* Admin-only: Managers page */}
                        {user && user.role === 'Admin' && (
                            <Link to="/register-manager" style={linkStyle('/register-manager')}>Managers</Link>
                        )}
                        <Link to="/billing" style={linkStyle('/billing')}>Billing</Link>

                        {/* About & Contact: hidden for Admins */}
                        {(!user || user.role !== 'Admin') && (
                            <>
                                <Link to="/about" style={linkStyle('/about')}>About</Link>
                                <Link to="/contact" style={linkStyle('/contact')}>Contact</Link>
                            </>
                        )}
                    </div>

                    {/* Right Aligned Login Button or User Profile */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {user ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: 'rgba(255, 255, 255, 0.6)',
                                padding: '6px 12px 6px 6px',
                                borderRadius: '30px',
                                border: '1px solid rgba(0, 0, 0, 0.05)',
                            }}>
                                {/* Avatar Circle - click opens password modal */}
                                <button
                                    onClick={handleSettingsClick}
                                    title="Account Settings"
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'var(--primary-color)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        border: 'none',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                    }}
                                >
                                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                </button>

                                {/* User details */}
                                <div style={{ display: 'flex', flexDirection: 'column', marginRight: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)', lineHeight: '1.2' }}>
                                        {user.fullName || 'User'}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', lineHeight: '1.2' }}>
                                        {user.role || 'Resident'}
                                    </span>
                                </div>

                                {/* Logout Button */}
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('user');
                                        setUser(null);
                                        window.location.href = '/login';
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-light)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'color 0.2s',
                                    }}
                                    title="Sign Out"
                                    onMouseOver={(e) => e.currentTarget.style.color = '#dc2626'}
                                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-light)'}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                </button>
                            </div>
                        ) : (
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
                        )}
                    </div>
                </div>
            </nav>

            {/* Password Re-Auth Modal */}
            {
                showPasswordModal && (
                    <div onClick={() => setShowPasswordModal(false)} style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div onClick={(e) => e.stopPropagation()} style={{
                            background: '#fff', borderRadius: '20px',
                            padding: '36px 32px', width: '100%', maxWidth: '400px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.2)', animation: 'fadeInUp 0.3s ease'
                        }}>
                            <h3 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                Confirm Identity
                            </h3>
                            <p style={{ margin: '0 0 24px', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                                Enter your current password to access Settings.
                            </p>

                            {modalError && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                                    background: 'rgba(220,38,38,0.08)', color: '#dc2626',
                                    border: '1px solid rgba(220,38,38,0.2)', fontSize: '0.85rem'
                                }}>{modalError}</div>
                            )}

                            <form onSubmit={handlePasswordConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <input
                                    type="password"
                                    placeholder="Your password"
                                    value={modalPassword}
                                    onChange={(e) => setModalPassword(e.target.value)}
                                    autoFocus
                                    style={{
                                        padding: '13px 16px', borderRadius: '12px', fontSize: '1rem',
                                        border: '1px solid rgba(118,128,116,0.3)', outline: 'none',
                                        fontFamily: 'inherit', color: 'var(--text-dark)'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="button" onClick={() => setShowPasswordModal(false)} style={{
                                        flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
                                        border: '1px solid rgba(0,0,0,0.1)', background: 'transparent',
                                        fontWeight: 600, color: 'var(--text-light)', fontSize: '0.95rem'
                                    }}>Cancel</button>
                                    <button type="submit" disabled={modalLoading} style={{
                                        flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
                                        border: 'none', background: 'var(--primary-color)',
                                        color: 'white', fontWeight: 600, fontSize: '0.95rem'
                                    }}>{modalLoading ? 'Verifying...' : 'Continue'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </>
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
                paddingTop: (location.pathname === '/vehicles' || location.pathname === '/workers' || location.pathname === '/register-manager') ? '0' : '72px',
                height: (location.pathname === '/vehicles' || location.pathname === '/workers' || location.pathname === '/register-manager') ? '100vh' : 'auto',
                overflow: (location.pathname === '/vehicles' || location.pathname === '/workers' || location.pathname === '/register-manager') ? 'hidden' : 'visible',
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
                    <Route path="/report-review" element={<ReportReview />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/vehicles" element={<VehicleManagement />} />
                    <Route path="/workers" element={<Workers />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/register-manager" element={<RegisterManager />} />
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
