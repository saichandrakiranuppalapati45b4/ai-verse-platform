import { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';

const LiveEventsController = () => {
    const [liveEvents, setLiveEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [streamLinks, setStreamLinks] = useState({}); // Local state for inputs

    // Registration View State
    const [viewRegistrationsId, setViewRegistrationsId] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);

    useEffect(() => {
        fetchLiveEvents();
    }, []);

    const fetchLiveEvents = async () => {
        try {
            const response = await api.get('/api/events?status=live');
            setLiveEvents(response.data.events);

            // Initialize stream link inputs
            const links = {};
            response.data.events.forEach(event => {
                links[event.id] = event.registration_link || '';
            });
            setStreamLinks(links);
        } catch (err) {
            console.error('Failed to fetch live events:', err);
            // Don't block UI on error, just log
            setLiveEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistrations = async (eventId) => {
        setLoadingRegistrations(true);
        try {
            const response = await api.get(`/api/events/${eventId}/registrations`);
            setRegistrations(response.data.registrations);
        } catch (err) {
            console.error('Failed to fetch registrations:', err);
            alert('Failed to load registrations');
        } finally {
            setLoadingRegistrations(false);
        }
    };

    const openRegistrations = (eventId) => {
        setViewRegistrationsId(eventId);
        fetchRegistrations(eventId);
    };

    const closeRegistrations = () => {
        setViewRegistrationsId(null);
        setRegistrations([]);
    };

    const handleUpdateLink = async (eventId) => {
        try {
            await api.put(`/api/events/${eventId}`, {
                registration_link: streamLinks[eventId]
            });
            alert('Stream link updated successfully!');
            fetchLiveEvents();
        } catch (err) {
            console.error('Failed to update link:', err);
            alert('Failed to update stream link');
        }
    };

    const handleStopLive = async (eventId) => {
        if (!window.confirm('Stop this live event? It will be marked as completed.')) return;
        try {
            await api.put(`/api/events/${eventId}`, { status: 'completed' });
            fetchLiveEvents();
            alert('Event stopped successfully');
        } catch (err) {
            console.error('Failed to stop event:', err);
            alert('Failed to stop event');
        }
    };

    const handleMarksUpdate = async (regId, newMarks) => {
        // Optimistically update local state
        const updatedRegistrations = registrations.map(reg =>
            reg.id === regId ? { ...reg, jury_marks: newMarks } : reg
        );
        setRegistrations(updatedRegistrations);

        try {
            await api.put(`/api/events/${viewRegistrationsId}/registrations/${regId}/marks`, { marks: newMarks });
        } catch (err) {
            console.error('Failed to update marks:', err);
            // Optionally revert state here if needed, or show toast
        }
    };

    const handleExport = () => {
        if (!registrations.length) return;

        // CSV Header
        const headers = ['Team Name', 'Team Lead', 'Lead Email', 'Lead Phone', 'Team Size', 'Members (Name - Email - Phone)', 'Jury Marks', 'Registered At'];

        // Map data to CSV rows
        const rows = registrations.map(reg => {
            const membersList = JSON.parse(reg.members || '[]');
            // Handle both old format (strings) and new format (objects)
            const members = membersList.map(m => {
                if (typeof m === 'object') {
                    return `${m.name} (${m.email}, ${m.phone})`;
                }
                return m;
            }).filter(m => m).join('\n');

            return [
                `"${reg.team_name.replace(/"/g, '""')}"`,
                `"${reg.team_lead_name.replace(/"/g, '""')}"`,
                `"${reg.team_lead_email.replace(/"/g, '""')}"`,
                `"${(reg.team_lead_phone || '').replace(/"/g, '""')}"`,
                reg.team_size,
                `"${members.replace(/"/g, '""')}"`,
                `"${(reg.jury_marks || '').replace(/"/g, '""')}"`,
                new Date(reg.created_at).toLocaleDateString()
            ].join(',');
        });

        // Combine header and rows
        const csvContent = [headers.join(','), ...rows].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `registrations_event_${viewRegistrationsId}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <Loader text="Loading live events..." />;

    return (
        <div>
            <h1>Live Events Controller</h1>
            <p className="text-muted">Manage currently active live streams</p>

            <div style={{ marginTop: '2rem' }}>
                {liveEvents.length === 0 ? (
                    <div className="card text-center" style={{ padding: '3rem' }}>
                        <h3>No Live Events</h3>
                        <p className="text-muted">Go to "Events" and click "Make Live" to start an event.</p>
                    </div>
                ) : (
                    <div className="grid grid-2">
                        {liveEvents.map(event => (
                            <div key={event.id} className="card animate-fade-in">
                                <div className="flex justify-between items-start mb-md">
                                    <div>
                                        <h3 style={{ margin: 0 }}>{event.title}</h3>
                                        <span className="badge badge-error animate-pulse" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                                            ● LIVE NOW
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleStopLive(event.id)}
                                    >
                                        ⏹ Stop Session
                                    </button>
                                </div>

                                <div className="mb-md" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => openRegistrations(event.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        👥 Registered Members
                                    </button>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Stream / Meeting Link</label>
                                    <div className="flex gap-sm">
                                        <input
                                            type="url"
                                            placeholder="https://youtube.com/... or https://zoom.us/..."
                                            value={streamLinks[event.id] || ''}
                                            onChange={(e) => setStreamLinks({ ...streamLinks, [event.id]: e.target.value })}
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleUpdateLink(event.id)}
                                        >
                                            Update
                                        </button>
                                    </div>
                                    <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                        Updating this link will immediately change where the "Join Now" button takes users on the public site.
                                    </p>
                                </div>

                                <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Event Details</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{event.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Registrations Modal */}
            {viewRegistrationsId && (
                <div className="modal-overlay" onClick={closeRegistrations}>
                    <div className="modal-content animate-scale-in no-scrollbar" onClick={e => e.stopPropagation()} style={{ maxWidth: 'none', width: '100%', height: '100%', maxHeight: 'none', borderRadius: 0, overflowY: 'auto' }}>
                        <style>
                            {`
                                .no-scrollbar::-webkit-scrollbar {
                                    display: none;
                                }
                                .no-scrollbar {
                                    -ms-overflow-style: none;
                                    scrollbar-width: none;
                                }
                            `}
                        </style>
                        <div className="flex justify-between items-center mb-md" style={{ padding: '0 2rem', paddingTop: '1rem' }}>
                            <h2>Registered Teams</h2>
                            <button className="btn-icon" onClick={closeRegistrations}>✕</button>
                        </div>

                        {loadingRegistrations ? (
                            <Loader text="Loading registrations..." />
                        ) : registrations.length === 0 ? (
                            <div className="text-center" style={{ padding: '2rem' }}>
                                <p className="text-muted">No registrations found for this event.</p>
                            </div>
                        ) : (
                            <div className="table-container" style={{ padding: '0 2rem' }}>
                                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #333', width: '15%' }}>Team Name</th>
                                            <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #333', width: '12%' }}>Lead</th>
                                            <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #333', width: '15%' }}>Contact</th>
                                            <th style={{ textAlign: 'center', padding: '1rem', borderBottom: '1px solid #333', width: '5%' }}>Size</th>
                                            <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #333', width: '38%' }}>Members</th>
                                            <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #333', width: '10%' }}>Jury Marks</th>
                                            <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #333', width: '5%' }}>Registered At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrations.map(reg => (
                                            <tr key={reg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top', wordBreak: 'break-word' }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{reg.team_name}</div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top', wordBreak: 'break-word' }}>
                                                    {reg.team_lead_name}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top', wordBreak: 'break-all' }}>
                                                    <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>📧 {reg.team_lead_email}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>📱 {reg.team_lead_phone || '-'}</div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', verticalAlign: 'top' }}>
                                                    <span className="badge badge-secondary">{reg.team_size}</span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top', wordBreak: 'break-word' }}>
                                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#ccc' }}>
                                                        {JSON.parse(reg.members || '[]').map((m, i) => {
                                                            if (typeof m === 'object') {
                                                                return (
                                                                    <li key={i} style={{ marginBottom: '0.5rem' }}>
                                                                        <span><strong>{m.name}</strong> <span style={{ color: '#666' }}>|</span> <span style={{ color: '#aaa', wordBreak: 'break-all' }}>{m.email}</span> <span style={{ color: '#666' }}>|</span> <span style={{ color: 'var(--color-primary)' }}>{m.phone}</span></span>
                                                                    </li>
                                                                );
                                                            }
                                                            // Fallback for old string format
                                                            return m ? <li key={i} style={{ marginBottom: '0.25rem' }}>{m}</li> : null;
                                                        })}
                                                    </ul>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="Marks"
                                                        value={reg.jury_marks || ''}
                                                        onChange={(e) => handleMarksUpdate(reg.id, e.target.value)}
                                                        style={{ padding: '0.4rem', fontSize: '0.9rem', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', verticalAlign: 'top', color: '#999' }}>
                                                    {new Date(reg.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {registrations.length > 0 && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleExport}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    📥 Export to Excel (CSV)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveEventsController;
