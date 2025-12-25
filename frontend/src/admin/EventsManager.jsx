import { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';

const EventsManager = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        venue: '',
        registration_link: '',
        status: 'upcoming'
    });
    const [posterFile, setPosterFile] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [modalError, setModalError] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await api.get('/api/events');
            setEvents(response.data.events);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch events:', err);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPosterFile(e.target.files[0]);
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({
            title: '',
            description: '',
            event_date: '',
            event_time: '',
            venue: '',
            registration_link: '',
            status: 'upcoming'
        });
        setPosterFile(null);
        setShowModal(true);
    };

    const openEditModal = (event) => {
        setIsEditing(true);
        setEditId(event.id);
        setFormData({
            title: event.title,
            description: event.description,
            event_date: event.event_date.split('T')[0], // Convert to YYYY-MM-DD
            event_time: event.event_time,
            venue: event.venue,
            registration_link: event.registration_link || '',
            status: event.status
        });
        setPosterFile(null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setModalError(null);

        try {
            let eventId;

            if (isEditing) {
                // Update existing event
                await api.put(`/api/events/${editId}`, formData);
                eventId = editId;
            } else {
                // Create new event
                const response = await api.post('/api/events', formData);
                eventId = response.data.event.id;
            }

            // Upload poster if provided
            if (posterFile) {
                const posterFormData = new FormData();
                posterFormData.append('poster', posterFile);
                await api.post(`/api/events/${eventId}/upload-poster`, posterFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setShowModal(false);
            fetchEvents();
            alert(isEditing ? 'Event updated successfully' : 'Event created successfully');
        } catch (err) {
            console.error('Failed to save event:', err);
            setModalError(err.response?.data?.error || 'Failed to save event');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleMakeLive = async (eventId) => {
        try {
            await api.put(`/api/events/${eventId}`, { status: 'live' });
            fetchEvents();
            alert('Event is now Live!');
        } catch (err) {
            console.error('Failed to make event live:', err);
            setError('Failed to update event status');
        }
    };

    const handleStopLive = async (eventId) => {
        if (!window.confirm('Are you sure you want to stop this live event? It will be marked as Completed.')) return;
        try {
            await api.put(`/api/events/${eventId}`, { status: 'completed' });
            fetchEvents();
            alert('Event is now marked as Completed');
        } catch (err) {
            console.error('Failed to stop event:', err);
            setError('Failed to update event status');
        }
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        try {
            await api.delete(`/api/events/${eventId}`);
            fetchEvents();
        } catch (err) {
            console.error('Failed to delete event:', err);
            setError('Failed to delete event');
        }
    };

    useEffect(() => {
        if (!showModal) {
            setModalError(null);
        }
    }, [showModal]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'live': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '#ef4444' };
            case 'upcoming': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '#3b82f6' };
            case 'completed': return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', border: '#6b7280' };
            default: return { bg: 'var(--color-bg-tertiary)', color: 'inherit', border: 'var(--color-border)' };
        }
    };

    if (loading) return <Loader text="Loading events..." />;

    return (
        <div>
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1>Events Manager</h1>
                    <p className="text-muted">Create, edit, and manage events</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    + Create Event
                </button>
            </div>

            {error && <div className="alert alert-error mb-md">{error}</div>}

            <div className="grid grid-3" style={{ gap: '1.5rem' }}>
                {events.length === 0 ? (
                    <div className="card text-center" style={{ gridColumn: '1 / -1', padding: '3rem' }}>
                        <p className="text-muted">No events found. Create your first event!</p>
                    </div>
                ) : (
                    events.map(event => {
                        const statusStyle = getStatusColor(event.status);
                        return (
                            <div key={event.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                {event.poster_url && (
                                    <img
                                        src={`http://localhost:5000${event.poster_url}`}
                                        alt={event.title}
                                        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                    />
                                )}
                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div className="flex justify-between items-start mb-md">
                                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{event.title}</h3>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '50px',
                                            background: statusStyle.bg,
                                            color: statusStyle.color,
                                            border: `1px solid ${statusStyle.border}`,
                                            fontWeight: 600,
                                            textTransform: 'uppercase'
                                        }}>
                                            {event.status}
                                        </span>
                                    </div>
                                    <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>
                                        {event.description.length > 100 ? event.description.substring(0, 100) + '...' : event.description}
                                    </p>
                                    <div style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                                        <div style={{ marginBottom: '0.5rem' }}>📅 {new Date(event.event_date).toLocaleDateString()} at {event.event_time}</div>
                                        <div>📍 {event.venue}</div>
                                    </div>
                                    <div className="flex gap-sm" style={{ marginTop: 'auto' }}>
                                        {event.status !== 'live' && (
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleMakeLive(event.id)}
                                                style={{ flex: 1 }}
                                            >
                                                🔴 Make Live
                                            </button>
                                        )}
                                        {event.status === 'live' && (
                                            <button
                                                className="btn btn-warning btn-sm"
                                                onClick={() => handleStopLive(event.id)}
                                                style={{ flex: 1, background: '#f59e0b', borderColor: '#f59e0b' }}
                                            >
                                                ⏹ Stop Live
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => openEditModal(event)}
                                            style={{ flex: 1 }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(event.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex justify-between items-center mb-lg">
                            <h2>{isEditing ? 'Edit Event' : 'Create New Event'}</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {modalError && <div className="alert alert-error mb-md">{modalError}</div>}

                            <div className="form-group">
                                <label className="form-label">Event Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="AI Workshop 2024"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description *</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    rows="4"
                                    placeholder="Describe your event..."
                                />
                            </div>

                            <div className="grid grid-2" style={{ gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Date *</label>
                                    <input
                                        type="date"
                                        name="event_date"
                                        value={formData.event_date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Time *</label>
                                    <input
                                        type="time"
                                        name="event_time"
                                        value={formData.event_time}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Venue *</label>
                                <input
                                    type="text"
                                    name="venue"
                                    value={formData.venue}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Main Auditorium"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Registration Link (Optional)</label>
                                <input
                                    type="url"
                                    name="registration_link"
                                    value={formData.registration_link}
                                    onChange={handleInputChange}
                                    placeholder="https://forms.google.com/..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Event Poster (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                    Upload an event poster image
                                </p>
                            </div>

                            <div className="flex gap-md justify-end mt-xl">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitLoading}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                                    {submitLoading ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsManager;
