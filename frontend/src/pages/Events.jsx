import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await api.get('/api/events');
                setEvents(response.data.events);
            } catch (err) {
                console.error('Failed to fetch events:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) return <Loader text="Loading events..." />;

    return (
        <div style={{ minHeight: '100vh', padding: '80px 2rem 2rem' }}>
            <Navbar />
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Events</h1>
                    <p className="text-muted" style={{ fontSize: '1.2rem' }}>
                        Browse our upcoming and past events
                    </p>
                </header>

                <div className="flex flex-col" style={{ gap: '1rem' }}>
                    {events.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem' }}>
                            <p className="text-muted">No events found yet. Check back later!</p>
                        </div>
                    ) : (
                        events.map(event => {
                            const isLive = event.status === 'live';
                            const isPast = event.status === 'completed';

                            return (
                                <div key={event.id} className="card animate-fade-in" style={{
                                    padding: '1.5rem 2rem',
                                    border: '1px solid var(--color-border)',
                                    background: 'linear-gradient(90deg, var(--color-bg-card), var(--color-bg-secondary))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '2rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                                        {/* Status/Date Badge */}
                                        <div style={{
                                            background: isLive ? 'rgba(220, 38, 38, 0.1)' : 'var(--color-bg-tertiary)',
                                            color: isLive ? '#ef4444' : 'var(--color-primary)',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '50px',
                                            fontWeight: 'bold',
                                            fontSize: '0.85rem',
                                            border: `1px solid ${isLive ? 'rgba(220, 38, 38, 0.3)' : 'var(--color-border)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            whiteSpace: 'nowrap',
                                            minWidth: '140px',
                                            justifyContent: 'center'
                                        }}>
                                            {isLive ? (
                                                <>
                                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
                                                    LIVE NOW
                                                </>
                                            ) : (
                                                <>
                                                    <span>{isPast ? '🏁' : '📅'}</span>
                                                    {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <h2 style={{ fontSize: '1.25rem', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{event.title}</h2>
                                                {!isLive && !isPast && <span className="text-muted" style={{ fontSize: '0.85rem' }}>at {event.event_time} • {event.venue}</span>}
                                            </div>

                                            {event.description && (
                                                <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '500px' }}>
                                                    {event.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ minWidth: '180px', display: 'flex', justifyContent: 'flex-end' }}>
                                        {event.registration_link && !isPast && (
                                            <a
                                                href={event.registration_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`btn ${isLive ? 'btn-danger' : 'btn-primary'} btn-sm`}
                                                style={{
                                                    padding: '0.75rem 1.5rem',
                                                    whiteSpace: 'nowrap',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                {isLive ? (
                                                    <><span>▶</span> Join Stream</>
                                                ) : (
                                                    <><span>🔗</span> Register Now</>
                                                )}
                                            </a>
                                        )}
                                        {isPast && (
                                            <span className="text-muted" style={{ fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem 1rem' }}>
                                                Event Completed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Events;
