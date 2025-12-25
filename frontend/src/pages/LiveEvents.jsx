import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';

const LiveEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLiveEvents = async () => {
            try {
                const response = await api.get('/api/events?status=live');
                setEvents(response.data.events);
            } catch (err) {
                console.error('Failed to fetch live events:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLiveEvents();
    }, []);

    if (loading) return <Loader text="Loading live events..." />;

    return (
        <div style={{ minHeight: '100vh', padding: '80px 2rem 2rem' }}>
            <Navbar />
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <h1 className="gradient-text animate-pulse" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Live Now</h1>
                    <p className="text-muted" style={{ fontSize: '1.2rem' }}>
                        Join currently active events and streams
                    </p>
                </header>

                <div className="flex flex-col" style={{ gap: '1rem' }}>
                    {events.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😴</div>
                            <h3>No events are live right now</h3>
                            <p className="text-muted">Check out our <a href="/events" style={{ color: 'var(--color-primary)' }}>Events</a> page for upcoming schedule.</p>
                        </div>
                    ) : (
                        events.map(event => (
                            <div key={event.id} className="card animate-fade-in" style={{
                                padding: '1rem 2rem',
                                border: '1px solid rgba(220, 38, 38, 0.3)',
                                background: 'linear-gradient(90deg, rgba(20, 20, 30, 0.95), rgba(10, 10, 15, 0.98))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '2rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                                    <div style={{
                                        background: 'rgba(220, 38, 38, 0.1)',
                                        color: '#ef4444',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '50px',
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                        border: '1px solid rgba(220, 38, 38, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '8px',
                                            height: '8px',
                                            background: '#ef4444',
                                            borderRadius: '50%',
                                            animation: 'pulse 2s infinite'
                                        }}></span>
                                        LIVE NOW
                                    </div>

                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', margin: 0, lineHeight: 1.2 }}>{event.title}</h2>
                                        {event.description && (
                                            <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', maxWidth: '600px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {event.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div style={{ minWidth: '200px', display: 'flex', justifyContent: 'flex-end' }}>
                                    {event.registration_link ? (
                                        <a
                                            href={event.registration_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary btn-sm"
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
                                                border: 'none',
                                                whiteSpace: 'nowrap',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <span>▶</span> Join Stream
                                        </a>
                                    ) : (
                                        <a
                                            href={`/register?eventId=${event.id}&event=${encodeURIComponent(event.title)}`}
                                            className="btn btn-secondary btn-sm"
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                whiteSpace: 'nowrap',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            <span>🔗</span> Register
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveEvents;
