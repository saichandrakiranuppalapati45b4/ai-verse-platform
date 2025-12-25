
import { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';

const JuryManager = () => {
    const [juryMembers, setJuryMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [imageFile, setImageFile] = useState(null);

    const [events, setEvents] = useState([]);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedJuryId, setSelectedJuryId] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState('');

    // New tabs state - Moved to top to avoid hook errors
    const [activeTab, setActiveTab] = useState('members');
    const [marksEventId, setMarksEventId] = useState('');
    const [eventTeams, setEventTeams] = useState([]);
    const [loadingTeams, setLoadingTeams] = useState(false);

    useEffect(() => {
        fetchJuryMembers();
        fetchEvents();
    }, []);

    useEffect(() => {
        if (marksEventId) {
            fetchEventTeams(marksEventId);
        } else {
            setEventTeams([]);
        }
    }, [marksEventId]);

    const fetchEvents = async () => {
        try {
            // Fetch all events for dropdown
            const response = await api.get('/api/events');
            // Check structure, might be { events: [] }
            setEvents(response.data.events || []);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        }
    };

    const fetchJuryMembers = async () => {
        try {
            const response = await api.get('/api/jury');
            setJuryMembers(response.data.jury);
        } catch (err) {
            console.error('Failed to fetch jury members:', err);
            setError('Failed to load jury members');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const resetForm = () => {
        setFormData({
            id: null,
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
        setImageFile(null);
        setError(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (member) => {
        setFormData({
            id: member.id,
            name: member.name,
            email: member.email,
            password: '',
            confirmPassword: ''
        });
        setImageFile(null);
        setError(null);
        setShowModal(true);
    };

    // Assign Event Handlers
    const openAssignModal = (memberId) => {
        setSelectedJuryId(memberId);
        setSelectedEventId('');
        setAssignModalOpen(true);
        setError(null);
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEventId) {
            setError('Please select an event');
            return;
        }
        setSubmitLoading(true);
        try {
            await api.post('/api/jury/assign', {
                juryId: selectedJuryId,
                eventId: selectedEventId
            });
            alert('Jury assigned to event successfully!');
            setAssignModalOpen(false);
            fetchJuryMembers();
        } catch (err) {
            console.error('Assignment error:', err);
            setError(err.response?.data?.error || 'Failed to assign event');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError(null);

        try {
            if (!formData.id) {
                if (formData.password !== formData.confirmPassword) {
                    setError("Passwords do not match");
                    setSubmitLoading(false);
                    return;
                }
                if (formData.password.length < 6) {
                    setError("Password must be at least 6 characters");
                    setSubmitLoading(false);
                    return;
                }
            }

            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password
            };

            if (formData.id) {
                await api.put(`/api/jury/${formData.id}`, payload);
            } else {
                await api.post('/api/jury', payload);
            }

            setShowModal(false);
            fetchJuryMembers();
        } catch (err) {
            console.error('Submit error:', err);
            setError(err.response?.data?.error || 'Failed to save jury member');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this jury member?')) return;

        try {
            await api.delete(`/api/jury/${id}`);
            fetchJuryMembers();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete jury member');
        }
    };

    if (loading) return <Loader text="Loading jury members..." />;

    // Hooks moved to top
    const fetchEventTeams = async (id) => {
        setLoadingTeams(true);
        try {
            const response = await api.get(`/api/events/${id}/teams`);
            setEventTeams(response.data.teams || []);
        } catch (err) {
            console.error('Failed to fetch teams:', err);
        } finally {
            setLoadingTeams(false);
        }
    };

    const handleCompleteEvent = async () => {
        if (!marksEventId) return;
        if (!window.confirm('Are you sure you want to mark this event as COMPLETE? This action cannot be undone.')) return;

        try {
            await api.put(`/api/events/${marksEventId}`, { status: 'completed' });
            alert('Event marked as completed successfully!');
            fetchEvents(); // Refresh event list status if needed
        } catch (err) {
            console.error('Failed to complete event:', err);
            alert('Failed to complete event. Please try again.');
        }
    };

    const calculateTotal = (marksJson) => {
        if (!marksJson) return 0;
        let marks = {};
        try {
            marks = typeof marksJson === 'string' ? JSON.parse(marksJson) : marksJson;
        } catch {
            return 0;
        }
        const innovation = parseFloat(marks.innovation) || 0;
        const feasibility = parseFloat(marks.feasibility) || 0;
        const statistics = parseFloat(marks.statistics) || 0;
        const revenue = parseFloat(marks.revenue) || 0;
        return (innovation + feasibility + statistics + revenue).toFixed(1);
    };

    const getMarkValue = (marksJson, field) => {
        if (!marksJson) return '-';
        try {
            const marks = typeof marksJson === 'string' ? JSON.parse(marksJson) : marksJson;
            return marks[field] || '-';
        } catch {
            return '-';
        }
    };

    if (loading) return <Loader text="Loading jury members..." />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>Jury Management</h1>
                    <p className="text-muted">Manage the panel of judges for events</p>
                </div>
                {activeTab === 'members' && (
                    <button className="btn btn-primary" onClick={openAddModal}>
                        + Add Jury Member
                    </button>
                )}
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <button
                    className={`btn ${activeTab === 'members' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('members')}
                    style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: activeTab === 'members' ? '2px solid var(--color-primary)' : 'none' }}
                >
                    Jury Members
                </button>
                <button
                    className={`btn ${activeTab === 'marks' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('marks')}
                    style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: activeTab === 'marks' ? '2px solid var(--color-primary)' : 'none' }}
                >
                    Marks of Event
                </button>
            </div>

            {activeTab === 'members' ? (
                <div className="card">
                    {juryMembers.length === 0 ? (
                        <div className="text-center" style={{ padding: '2rem' }}>
                            <p className="text-muted">No jury members found. Click "Add Jury Member" to start.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Profile</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Designation</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Contact</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Assigned Events</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {juryMembers.map(member => (
                                    <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            {member.photo_url ? (
                                                <img
                                                    src={`${api.defaults.baseURL}${member.photo_url}`}
                                                    alt={member.name}
                                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    background: 'var(--color-background)', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    border: '1px solid var(--color-border)'
                                                }}>
                                                    ⚖️
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>
                                            <div>{member.name}</div>
                                            {member.organization && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{member.organization}</div>}
                                        </td>
                                        <td style={{ padding: '1rem' }}>{member.designation || '-'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div>{member.email}</div>
                                            {member.phone && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{member.phone}</div>}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {member.assignments && member.assignments.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {member.assignments.map(assign => (
                                                        <span key={assign.id} style={{
                                                            background: 'rgba(59, 130, 246, 0.1)',
                                                            color: '#60a5fa',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem',
                                                            border: '1px solid rgba(59, 130, 246, 0.2)'
                                                        }}>
                                                            {assign.title}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted" style={{ fontSize: '0.9rem' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {member.assignments && member.assignments.length > 0 ? (
                                                <button
                                                    className="btn btn-sm"
                                                    style={{
                                                        marginRight: '0.5rem',
                                                        background: 'var(--color-success)',
                                                        borderColor: 'var(--color-success)',
                                                        cursor: 'default',
                                                        opacity: 0.8
                                                    }}
                                                    disabled
                                                >
                                                    Assigned
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    style={{ marginRight: '0.5rem', background: '#eab308', borderColor: '#eab308' }} // Yellow/Gold
                                                    onClick={() => openAssignModal(member.id)}
                                                    title="Assign to Event"
                                                >
                                                    Assign Event
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                style={{ marginRight: '0.5rem' }}
                                                onClick={() => openEditModal(member)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(member.id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <div className="card">
                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div style={{ maxWidth: '300px', flex: 1 }}>
                            <label className="form-label">Select Event to View Marks</label>
                            <select
                                value={marksEventId}
                                onChange={(e) => setMarksEventId(e.target.value)}
                                className="form-control"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-secondary)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                            >
                                <option value="">-- Choose an Event --</option>
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>{event.title} {event.status === 'completed' ? '(Completed)' : ''}</option>
                                ))}
                            </select>
                        </div>
                        {marksEventId && (() => {
                            const selectedEvent = events.find(e => e.id == marksEventId);
                            const isCompleted = selectedEvent?.status === 'completed';

                            return (
                                <button
                                    className={`btn ${isCompleted ? 'btn-secondary' : 'btn-success'}`}
                                    onClick={!isCompleted ? handleCompleteEvent : undefined}
                                    disabled={isCompleted}
                                    style={{
                                        background: isCompleted ? 'var(--color-bg-secondary)' : 'var(--color-success)',
                                        borderColor: isCompleted ? 'var(--color-border)' : 'var(--color-success)',
                                        color: isCompleted ? 'var(--color-text-muted)' : 'white',
                                        marginLeft: '1rem',
                                        cursor: isCompleted ? 'not-allowed' : 'pointer',
                                        opacity: isCompleted ? 0.7 : 1
                                    }}
                                >
                                    {isCompleted ? '✅ Event Completed' : '✅ Mark Event as Complete'}
                                </button>
                            );
                        })()}
                    </div>

                    {!marksEventId ? (
                        <div className="text-center" style={{ padding: '3rem', color: 'var(--color-text-muted)' }}>
                            Please select an event to view team marks.
                        </div>
                    ) : loadingTeams ? (
                        <Loader text="Loading marks..." />
                    ) : eventTeams.length === 0 ? (
                        <div className="text-center" style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>
                            No teams found for this event.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Team Name</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Leader</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Innovation</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Feasibility</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Statistics</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Revenue</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventTeams
                                        .sort((a, b) => {
                                            const selectedEvent = events.find(e => e.id == marksEventId);
                                            // Only sort by marks if event is completed
                                            if (selectedEvent?.status === 'completed') {
                                                const totalA = parseFloat(calculateTotal(a.marks));
                                                const totalB = parseFloat(calculateTotal(b.marks));
                                                return totalB - totalA; // Descending order
                                            }
                                            return 0; // Keep original order
                                        })
                                        .map((team, index) => (
                                            <tr key={team.id} style={{ borderBottom: '1px solid var(--color-border)', background: index === 0 && events.find(e => e.id == marksEventId)?.status === 'completed' ? 'rgba(234, 179, 8, 0.1)' : 'transparent' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500 }}>
                                                    {team.team_name}
                                                    {index === 0 && events.find(e => e.id == marksEventId)?.status === 'completed' && <span style={{ marginLeft: '0.5rem' }}>👑</span>}
                                                </td>
                                                <td style={{ padding: '1rem' }}>{team.leader_name}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>{getMarkValue(team.marks, 'innovation')}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>{getMarkValue(team.marks, 'feasibility')}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>{getMarkValue(team.marks, 'statistics')}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>{getMarkValue(team.marks, 'revenue')}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                    {calculateTotal(team.marks)}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card animate-scale-in" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{formData.id ? 'Edit Jury Member' : 'Add Jury Member'}</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g. Dr. Jane Judge"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="jane@example.com"
                                />
                            </div>

                            {!formData.id && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Password *</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Enter password"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Confirm Password *</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Confirm password"
                                        />
                                    </div>
                                </>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitLoading}
                                    style={{ flex: 1 }}
                                >
                                    {submitLoading ? 'Saving...' : 'Save Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Event Modal */}
            {assignModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card animate-scale-in" style={{ width: '90%', maxWidth: '450px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Assign to Event</h2>

                        <form onSubmit={handleAssignSubmit}>
                            <div className="form-group">
                                <label className="form-label">Select Event</label>
                                <select
                                    value={selectedEventId}
                                    onChange={(e) => setSelectedEventId(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-secondary)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                >
                                    <option value="">-- Choose an Event --</option>
                                    {events
                                        .filter(event => {
                                            const currentJury = juryMembers.find(m => m.id === selectedJuryId);
                                            // If no jury selected or no assignments, show all
                                            if (!currentJury || !currentJury.assignments) return true;
                                            // Return true if event ID is NOT in assignments
                                            return !currentJury.assignments.some(assign => assign.id === event.id);
                                        })
                                        .map(event => (
                                            <option key={event.id} value={event.id}>
                                                {event.title} ({new Date(event.event_date).toLocaleDateString()})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setAssignModalOpen(false)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitLoading}
                                    style={{ flex: 1 }}
                                >
                                    {submitLoading ? 'Assigning...' : 'Assign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
};

export default JuryManager;
