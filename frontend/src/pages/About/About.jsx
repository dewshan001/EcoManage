import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      {/* Background Decorations */}
      <div className="about-bg-shape shape-1"></div>
      <div className="about-bg-shape shape-2"></div>
      <div className="about-bg-shape shape-3"></div>

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content animate-fade-in-up">
          <span className="section-tag dark">WHO WE ARE</span>
          <h1 className="about-hero-title">
            Transforming Waste Management for a <span className="highlight">Greener Tomorrow</span>
          </h1>
          <p className="about-hero-subtitle">
            EcoManage is Sri Lanka's pioneering intelligent waste management platform, connecting
            communities, municipal officers, and field teams to create cleaner, healthier cities
            through technology and collaboration.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats animate-fade-in-up delay-100">
        <div className="about-stats-container">
          <div className="stat-card">
            <div className="stat-icon">🌍</div>
            <div className="stat-number">15+</div>
            <div className="stat-label">Municipalities</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-number">12,500+</div>
            <div className="stat-label">Reports Processed</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">♻️</div>
            <div className="stat-number">4,820</div>
            <div className="stat-label">Tonnes Collected</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-number">99.2%</div>
            <div className="stat-label">Resolution Rate</div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="about-mission-vision">
        <div className="mission-vision-grid">
          <div className="mv-card mission-card animate-fade-in-up delay-150">
            <div className="mv-icon-wrapper">
              <div className="mv-icon">🎯</div>
            </div>
            <h2 className="mv-title">Our Mission</h2>
            <p className="mv-description">
              To revolutionize waste management in Sri Lanka by empowering citizens to report
              environmental issues instantly, enabling officers to respond efficiently, and
              creating transparent, accountable systems that ensure every community enjoys clean,
              sustainable living spaces.
            </p>
            <ul className="mv-list">
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Citizen-first reporting platform
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Real-time officer coordination
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Data-driven resource allocation
              </li>
            </ul>
          </div>

          <div className="mv-card vision-card animate-fade-in-up delay-200">
            <div className="mv-icon-wrapper">
              <div className="mv-icon">🌟</div>
            </div>
            <h2 className="mv-title">Our Vision</h2>
            <p className="mv-description">
              A future where every street, park, and public space across Sri Lanka is pristine,
              where technology seamlessly bridges the gap between citizens and municipal services,
              and where sustainable waste management becomes a source of national pride and
              environmental leadership in South Asia.
            </p>
            <ul className="mv-list">
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Zero-waste communities by 2030
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Regional sustainability leader
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Carbon-neutral operations
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="about-values">
        <div className="values-header animate-fade-in-up delay-250">
          <span className="section-tag dark">OUR PRINCIPLES</span>
          <h2 className="values-title">Core Values That Drive Us</h2>
          <p className="values-subtitle">
            Every decision we make is guided by these fundamental principles
          </p>
        </div>

        <div className="values-grid">
          <div className="value-card animate-fade-in-up delay-300">
            <div className="value-icon">🌱</div>
            <h3 className="value-title">Sustainability First</h3>
            <p className="value-description">
              We prioritize long-term environmental health over short-term gains, ensuring our
              solutions benefit future generations.
            </p>
          </div>

          <div className="value-card animate-fade-in-up delay-350">
            <div className="value-icon">🤝</div>
            <h3 className="value-title">Community Partnership</h3>
            <p className="value-description">
              Success comes from collaboration. We work hand-in-hand with citizens, officers, and
              local authorities.
            </p>
          </div>

          <div className="value-card animate-fade-in-up delay-400">
            <div className="value-icon">💡</div>
            <h3 className="value-title">Innovation & Technology</h3>
            <p className="value-description">
              Leveraging cutting-edge solutions to make waste management efficient, transparent,
              and accessible to all.
            </p>
          </div>

          <div className="value-card animate-fade-in-up delay-100">
            <div className="value-icon">🎯</div>
            <h3 className="value-title">Accountability</h3>
            <p className="value-description">
              Every report is tracked, every task is monitored, and every outcome is measured for
              continuous improvement.
            </p>
          </div>

          <div className="value-card animate-fade-in-up delay-150">
            <div className="value-icon">⚡</div>
            <h3 className="value-title">Rapid Response</h3>
            <p className="value-description">
              Time matters. Our system ensures complaints are reviewed and resolved in record time
              with efficient task dispatch.
            </p>
          </div>

          <div className="value-card animate-fade-in-up delay-200">
            <div className="value-icon">🌍</div>
            <h3 className="value-title">Environmental Stewardship</h3>
            <p className="value-description">
              Protecting our planet is non-negotiable. Every action we take considers ecological
              impact.
            </p>
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="about-journey">
        <div className="journey-header animate-fade-in-up delay-250">
          <span className="section-tag dark">OUR JOURNEY</span>
          <h2 className="journey-title">From Vision to Reality</h2>
        </div>

        <div className="timeline">
          <div className="timeline-item animate-fade-in-up delay-300">
            <div className="timeline-marker">
              <div className="timeline-dot"></div>
            </div>
            <div className="timeline-content">
              <div className="timeline-year">2024</div>
              <h3 className="timeline-event">Platform Launch</h3>
              <p className="timeline-description">
                EcoManage goes live in Colombo, introducing Sri Lanka's first citizen-powered waste
                reporting system.
              </p>
            </div>
          </div>

          <div className="timeline-item animate-fade-in-up delay-350">
            <div className="timeline-marker">
              <div className="timeline-dot"></div>
            </div>
            <div className="timeline-content">
              <div className="timeline-year">2025</div>
              <h3 className="timeline-event">Rapid Expansion</h3>
              <p className="timeline-description">
                15 municipalities adopt EcoManage. Over 10,000 reports processed with 99%+
                resolution rate.
              </p>
            </div>
          </div>

          <div className="timeline-item animate-fade-in-up delay-400">
            <div className="timeline-marker">
              <div className="timeline-dot active"></div>
            </div>
            <div className="timeline-content">
              <div className="timeline-year">2026</div>
              <h3 className="timeline-event">Innovation & Recognition</h3>
              <p className="timeline-description">
                Ministry endorsement received. ISO 14001 certification achieved. AI-powered task
                optimization deployed.
              </p>
            </div>
          </div>

          <div className="timeline-item animate-fade-in-up delay-100">
            <div className="timeline-marker">
              <div className="timeline-dot future"></div>
            </div>
            <div className="timeline-content">
              <div className="timeline-year">2027</div>
              <h3 className="timeline-event">National Scale</h3>
              <p className="timeline-description">
                Targeting 50+ municipalities island-wide. Real-time predictive analytics and
                automated waste collection scheduling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Be Part of the Change Section */}
      <section className="about-change">
        <div className="change-header animate-fade-in-up delay-250">
          <span className="section-tag dark">GET INVOLVED</span>
          <h2 className="change-title">Be Part of the Change</h2>
          <p className="change-subtitle">
            Join thousands making a difference in their communities
          </p>
        </div>

        <div className="change-grid">
          <div className="change-card animate-fade-in-up delay-300">
            <div className="change-icon">👥</div>
            <h3 className="change-card-title">Citizen Reporting</h3>
            <p className="change-card-desc">
              Report waste and environmental issues in your area and help your community stay clean
            </p>
          </div>

          <div className="change-card animate-fade-in-up delay-350">
            <div className="change-icon">🏛️</div>
            <h3 className="change-card-title">For Municipalities</h3>
            <p className="change-card-desc">
              Adopt EcoManage to streamline operations, reduce costs, and improve citizen satisfaction
            </p>
          </div>

          <div className="change-card animate-fade-in-up delay-400">
            <div className="change-icon">🤝</div>
            <h3 className="change-card-title">Partner With Us</h3>
            <p className="change-card-desc">
              Collaborate with EcoManage to amplify environmental impact across Sri Lanka
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
