import { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentEvents, setRecentEvents] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            if (user?.role === 'jury') {
                // Fetch jury-specific events using jury_member_id
                // The jury_member_id is set by the auth middleware when a jury user logs in
                const juryMemberId = user.jury_member_id;
                if (juryMemberId) {
                    const juryResponse = await api.get(`/api/jury/${juryMemberId}/assignments`);
                    setMyEvents(juryResponse.data.assignments || []);
                } else {
                    console.error('No jury_member_id found for jury user');
                    setMyEvents([]);
                }
            } else {
                // Fetch admin dashboard stats
                const response = await api.get('/api/dashboard/stats');
                setStats(response.data.stats || {});
                setRecentEvents(Array.isArray(response.data.recentEvents) ? response.data.recentEvents : []);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader text="Loading dashboard..." />;

    // Jury Dashboard View
    if (user?.role === 'jury') {
        return (
            <div>
                <h1>My Events</h1>
                <p className="text-muted">Events assigned to you as a jury member</p>

                {myEvents.length === 0 ? (
                    <div className="card" style={{ marginTop: 'var(--spacing-xl)', padding: '2rem', textAlign: 'center' }}>
                        <p className="text-muted">No events assigned to you yet</p>
                    </div>
                ) : (
                    <div className="grid grid-3" style={{ marginTop: 'var(--spacing-xl)', gap: 'var(--spacing-lg)' }}>
                        {myEvents.map(assignment => (
                            <div key={assignment.id} className="card" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'transform 0.2s ease',
                                cursor: 'default'
                            }}>
                                <div>
                                    <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-primary)' }}>
                                        {assignment.event_title}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: 'var(--spacing-lg)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>📅</span>
                                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                                Event Date: <strong>{new Date(assignment.event_date).toLocaleDateString()}</strong>
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>✅</span>
                                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                                Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                    onClick={() => window.location.href = `/admin/jury/marking/${assignment.event_id}`}
                                >
                                    Check In & Enter Marks
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Admin Dashboard View
    return (
        <div>
            <h1>Dashboard</h1>
            <p className="text-muted">
                Welcome to AI Verse Admin Panel
            </p>

            <div className="grid grid-4" style={{ marginTop: 'var(--spacing-xl)' }}>
                <div className="card">
                    <h3 style={{ color: 'var(--color-primary)' }}>{stats?.totalEvents || 0}</h3>
                    <p className="text-muted">Total Events</p>
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--color-success)' }}>{stats?.upcomingEvents || 0}</h3>
                    <p className="text-muted">Upcoming Events</p>
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--color-accent)' }}>{stats?.galleryItems || 0}</h3>
                    <p className="text-muted">Gallery Items</p>
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--color-secondary)' }}>{stats?.teamMembers || 0}</h3>
                    <p className="text-muted">Team Members</p>
                </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-2xl)' }}>
                <h2>Recent Events</h2>
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    {recentEvents.length === 0 ? (
                        <p className="text-muted">No events yet</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Title</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Time</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEvents.map(event => (
                                    <tr key={event.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: 'var(--spacing-md)' }}>{event.title}</td>
                                        <td style={{ padding: 'var(--spacing-md)' }}>{new Date(event.event_date).toLocaleDateString()}</td>
                                        <td style={{ padding: 'var(--spacing-md)' }}>{event.event_time}</td>
                                        <td style={{ padding: 'var(--spacing-md)' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: '0.8125rem',
                                                fontWeight: 500,
                                                background: event.status === 'upcoming' ? 'rgba(16, 185, 129, 0.1)' :
                                                    event.status === 'live' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                                color: event.status === 'upcoming' ? 'var(--color-success)' :
                                                    event.status === 'live' ? 'var(--color-error)' : 'var(--color-text-muted)'
                                            }}>
                                                {event.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
