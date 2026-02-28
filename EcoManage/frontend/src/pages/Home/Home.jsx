import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {

    const heroBgRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            if (heroBgRef.current) {
                heroBgRef.current.style.transform = `translateY(${scrollY * 0.35}px)`;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="home-container">

            {/* ─── Hero ─── */}
            <section className="hero-section">
                <div
                    ref={heroBgRef}
                    className="hero-bg"
                    style={{ backgroundImage: `url(https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2000&auto=format&fit=crop)` }} /* Lush green forest */
                />
                <div className="hero-content container">
                    <div className="hero-text-glass glass-dark animate-fade-in-up">
                        <div className="hero-badge">
                            <span className="badge-dot" />
                            🌱 Sustainable Eco-Management — Sri Lanka
                        </div>
                        <h1 className="hero-title">
                            Nurturing Cities Through{' '}
                            <span className="highlight">Sustainable Ecosystems.</span>
                        </h1>
                        <p className="hero-subtitle">
                            A community-first initiative returning our urban spaces to nature.
                            Fusing organic reporting and caring local operations
                            to maintain pristine environments.
                        </p>
                        <div className="hero-cta-group">
                            <Link to="/register" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block' }}>Report an Issue</Link>
                            <button
                                className="btn-secondary"
                                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                            >Explore System →</button>
                        </div>
                        <div className="trust-row">
                            <span>✅ ISO 14001 Certified</span>
                            <span className="trust-divider">|</span>
                            <span>🌍 15+ Municipalities</span>
                            <span className="trust-divider">|</span>
                            <span>🏛️ Ministry Endorsed</span>
                            <span className="trust-divider">|</span>
                            <span>🔒 GDPR Compliant</span>
                        </div>
                    </div>
                </div>
                <div className="hero-scroll-indicator">
                    <div className="scroll-mouse">
                        <div className="scroll-wheel" />
                    </div>
                </div>
            </section>

            {/* ─── Live Stats Ticker ─── */}
            <div className="stats-ticker-wrapper">
                <div className="stats-ticker">
                    {[
                        { value: '4,820+', label: 'Tonnes Collected' },
                        { value: '312', label: 'Active Workers' },
                        { value: '99.2%', label: 'Reports Resolved' },
                        { value: '15', label: 'Municipalities Onboarded' },
                        { value: '24/7', label: 'Live Monitoring' },
                        { value: '48h', label: 'Avg. Resolution Time' },
                        { value: '4,820+', label: 'Tonnes Collected' },
                        { value: '312', label: 'Active Workers' },
                        { value: '99.2%', label: 'Reports Resolved' },
                        { value: '15', label: 'Municipalities Onboarded' },
                        { value: '24/7', label: 'Live Monitoring' },
                        { value: '48h', label: 'Avg. Resolution Time' },
                    ].map((stat, i) => (
                        <div key={i} className="ticker-item">
                            <span className="ticker-value">{stat.value}</span>
                            <span className="ticker-label">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Impact Metrics ─── */}
            <section className="metrics-section">
                <div className="container">
                    <div className="metrics-grid">
                        {[
                            { number: '24/7', label: 'Community Care Reporting', icon: '🌱', desc: 'Round-the-clock eco-issue submission and careful triage' },
                            { number: '100%', label: 'Ecological Traceability', icon: '🌿', desc: 'Tracking the lifecycle of every reported environmental concern' },
                            { number: '48h', label: 'Rapid Restoration', icon: '⏱️', desc: 'From report to pristine space in under two days' },
                            { number: '4.9★', label: 'Resident Harmony', icon: '🌻', desc: 'Consistently high praise from local communities' },
                        ].map((m, i) => (
                            <div key={i} className={`metric-item animate-fade-in-up delay-${(i + 1) * 100}`}>
                                <div className="metric-icon">{m.icon}</div>
                                <div className="metric-number">{m.number}</div>
                                <div className="metric-label">{m.label}</div>
                                <p className="metric-desc">{m.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How It Works ─── */}
            <section className="process-section">
                <div className="container">
                    <div className="section-header animate-fade-in-up">
                        <span className="section-tag">THE PROCESS</span>
                        <h2>The EcoManage Lifecycle</h2>
                        <p>A transparent, high-efficiency pipeline from public reporting to operational resolution — fully automated.</p>
                    </div>

                    <div className="process-cards">
                        {[
                            {
                                step: '01',
                                icon: '🌱',
                                title: 'Community Care Reporting',
                                body: 'Citizens flag environmental anomalies via an intuitive mobile interface. High-precision GPS and photo uploads instantly register issues, enabling immediate ecological assessment.',
                                tag: 'Community Root',
                                image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop', // saplings
                            },
                            {
                                step: '02',
                                icon: '🌿',
                                title: 'Local Review & Triage',
                                body: 'Administrators parse incoming reports and trigger restoration tasks. Our organic management protocols distribute tasks to specialized local ground units, maintaining the community ecosystem.',
                                tag: 'Growth Layer',
                                image: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=800&auto=format&fit=crop', // community cleanup
                            },
                            {
                                step: '03',
                                icon: '🌍',
                                title: 'Restoration & Preservation',
                                body: 'Specialized teams are guided through urban centers to clear and restore affected areas. The integrated system ensures all ecological contributions are properly managed and recorded.',
                                tag: 'Canopy Layer',
                                image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', // peaceful forest
                            },
                        ].map((card, i) => (
                            <div key={i} className={`process-card animate-fade-in-up delay-${(i + 1) * 100}`}>
                                <img src={card.image} alt={card.title} className="process-card-image" />
                                <div className="process-card-content">
                                    <div className="process-card-top">
                                        <span className="process-step-num">{card.step}</span>
                                        <span className="process-card-tag">{card.tag}</span>
                                    </div>
                                    <h3>{card.title}</h3>
                                    <p>{card.body}</p>
                                    <div className="process-card-line" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Features Bento Grid ─── */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag dark">ECO-PRACTICES</span>
                        <h2 style={{ color: 'var(--text-dark)' }}>Nurturing Our Environment</h2>
                        <p style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '16px auto 0', lineHeight: '1.7' }}>
                            Harmonizing human infrastructure with ecological balance for a cleaner, greener tomorrow.
                        </p>
                    </div>

                    <div className="bento-grid">
                        <div className="bento-card bento-large animate-fade-in-up delay-100">
                            <div className="bento-card-content">
                                <div className="bento-icon">🌻</div>
                                <h3>Community Awareness Network</h3>
                                <p>Educational portals and localized broadcast tools designed to foster sustainable community practices and deep civic engagement across every district.</p>
                                <div className="bento-badge">Popular</div>
                            </div>
                            <div className="bento-card-image-bg" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop)` }} /> {/* Nature people */}
                        </div>
                        <div className="bento-card animate-fade-in-up delay-150">
                            <div className="bento-card-content">
                                <div className="bento-icon">🧑‍🌾</div>
                                <h3>Ecological Teams</h3>
                                <p>Granular attendance modules, shift scheduling, and task accountability metrics ensuring community care teams are supported.</p>
                            </div>
                        </div>

                        {/* Row 2: 3 small cards */}
                        <div className="bento-card animate-fade-in-up delay-200">
                            <div className="bento-card-content">
                                <div className="bento-icon">💧</div>
                                <h3>Seamless Contributions</h3>
                                <p>Accessible funding streams managing complex subscription tiers, single-service donations, and financial transparency.</p>
                            </div>
                        </div>
                        <div className="bento-card animate-fade-in-up delay-250">
                            <div className="bento-card-content">
                                <div className="bento-icon">🧭</div>
                                <h3>Eco-Tracking</h3>
                                <p>Live location tracking for all ecological field workers and transport, overlaid on an interactive municipal grid.</p>
                            </div>
                        </div>
                        <div className="bento-card animate-fade-in-up delay-300">
                            <div className="bento-card-content">
                                <div className="bento-icon">🍃</div>
                                <h3>Organic Updates</h3>
                                <p>Push and SMS alerts keeping residents informed of community cleanup schedules and restored public areas.</p>
                            </div>
                        </div>

                        {/* Row 3: 1 Full width card */}
                        <div className="bento-card bento-full animate-fade-in-up delay-350">
                            <div className="bento-card-content bento-row-layout">
                                <div className="bento-text-area">
                                    <div className="bento-icon">🌳</div>
                                    <h3>Root-Level Sustainability Insights</h3>
                                    <p>Deep-dive analytics on restoration efficiency, unresolved affected zones, seasonal trends, and predictive community scheduling — all in one unified view.</p>
                                    <div className="bento-badge">New Hub</div>
                                </div>
                                <div className="bento-large-image-wrapper">
                                    <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop" alt="Nature Canopy Dashboard" className="bento-large-image" /> {/* Forest image */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Testimonials ─── */}
            <section className="testimonials-section">
                <div className="container">
                    <div className="section-header animate-fade-in-up">
                        <span className="section-tag">TESTIMONIALS</span>
                        <h2>Trusted by Communities</h2>
                        <p>Hear from the administrators and residents who rely on EcoManage every day.</p>
                    </div>
                    <div className="testimonials-grid">
                        {[
                            {
                                quote: "EcoManage transformed how our municipality handles waste. The real-time dashboard alone saved us hundreds of hours in manual reporting.",
                                name: "Chaminda Perera",
                                role: "Municipal Director, Colombo West",
                                avatar: "CP",
                            },
                            {
                                quote: "I reported a dumping site near our school at 9 PM. By morning it was cleared. I've never seen our local council move that fast.",
                                name: "Dilani Jayasinghe",
                                role: "Resident, Moratuwa",
                                avatar: "DJ",
                            },
                            {
                                quote: "The route optimization feature cut our fuel costs by 22% in the first month. The ROI was immediate and measurable.",
                                name: "Roshan Fernando",
                                role: "Fleet Manager, Gampaha District",
                                avatar: "RF",
                            },
                        ].map((t, i) => (
                            <div key={i} className={`testimonial-card animate-fade-in-up delay-${(i + 1) * 100}`}>
                                <div className="testimonial-stars">★★★★★</div>
                                <blockquote>"{t.quote}"</blockquote>
                                <div className="testimonial-author">
                                    <div className="author-avatar">{t.avatar}</div>
                                    <div>
                                        <strong>{t.name}</strong>
                                        <span>{t.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Partners Strip ─── */}
            <section className="partners-section">
                <div className="container">
                    <p className="partners-label">TRUSTED BY MUNICIPALITIES & PARTNERS ACROSS SRI LANKA</p>
                    <div className="partners-strip">
                        {['Colombo MC', 'Gampaha DC', 'Kandy MC', 'Matara MC', 'Negombo UC', 'Galle MC', 'Ministry of Environment', 'SLPA'].map((p, i) => (
                            <span key={i} className="partner-name">{p}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA Section ─── */}
            <section className="cta-section">
                <div className="cta-bg-orb cta-orb-1" />
                <div className="cta-bg-orb cta-orb-2" />
                <div className="container">
                    <div className="cta-glass animate-fade-in-up">
                        <div className="cta-icon-row">🌍</div>
                        <h2>Ready to Grow a Greener Future?</h2>
                        <p>Plant the seeds of sustainable management today and watch your community's ecological footprint shrink naturally within the first month.</p>
                        <div className="cta-actions">
                            <button className="btn-primary cta-btn">Contact Integration Team</button>
                            <a href="/about" className="cta-link">Learn more about EcoManage →</a>
                        </div>
                        <div className="cta-trust">
                            <span>🛡️ Secure &amp; Compliant</span>
                            <span>⚡ 30-Day Deployment</span>
                            <span>📞 24/7 Support</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <h3 className="footer-logo">EcoManage.</h3>
                            <p>Engineering a pristine Sri Lanka through intelligent, connected waste management infrastructure.</p>
                            <div className="footer-socials">
                                <a href="#" aria-label="Twitter">𝕏</a>
                                <a href="#" aria-label="LinkedIn">in</a>
                                <a href="#" aria-label="Facebook">f</a>
                            </div>
                        </div>
                        <div className="footer-col">
                            <h4>Platform</h4>
                            <a href="/dashboard">Dashboard</a>
                            <a href="/schedule">Schedules</a>
                            <a href="/">Report Issue</a>
                            <a href="/about">About Us</a>
                        </div>
                        <div className="footer-col">
                            <h4>Resources</h4>
                            <a href="#">Documentation</a>
                            <a href="#">API Access</a>
                            <a href="#">Community Blog</a>
                            <a href="#">Privacy Policy</a>
                        </div>
                        <div className="footer-col">
                            <h4>Contact</h4>
                            <a href="mailto:info@ecomanage.lk">info@ecomanage.lk</a>
                            <a href="tel:+94112345678">+94 11 234 5678</a>
                            <span>Colombo 03, Sri Lanka</span>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© {new Date().getFullYear()} EcoManage. All rights reserved. Engineering a Pristine Sri Lanka.</p>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default Home;
