import React from 'react';

const Dashboard = () => {
    return (
        <div style={{ width: '100%', padding: '36px 32px 24px' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-dark)' }}>
                    Dashboard
                </h2>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-mid)' }}>
                    View your garbage management metrics here.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
