import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';

const JuryMarking = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [teams, setTeams] = useState([]);
    const [marks, setMarks] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingTeamId, setEditingTeamId] = useState(null);

    useEffect(() => {
        fetchEventAndTeams();
    }, [eventId]);

    const fetchEventAndTeams = async () => {
        try {
            // Fetch event details
            const eventResponse = await api.get(`/api/events/${eventId}`);
            setEvent(eventResponse.data.event || eventResponse.data);

            // Fetch registered teams for this event
            const teamsResponse = await api.get(`/api/events/${eventId}/teams`);
            setTeams(teamsResponse.data.teams || []);

            // Initialize marks state with detailed structure
            const initialMarks = {};
            (teamsResponse.data.teams || []).forEach(team => {
                // Parse existing marks if they are stored as JSON strings
                let existingMarks = {};
                try {
                    existingMarks = typeof team.marks === 'string' ? JSON.parse(team.marks) : (team.marks || {});
                } catch (e) {
                    console.error('Error parsing marks for team', team.id, e);
                    existingMarks = {};
                }

                initialMarks[team.id] = {
                    innovation: existingMarks.innovation || '',
                    feasibility: existingMarks.feasibility || '',
                    statistics: existingMarks.statistics || '',
                    revenue: existingMarks.revenue || ''
                };
            });
            setMarks(initialMarks);
        } catch (error) {
            console.error('Failed to fetch event data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (teamId, field, value) => {
        if (event?.status === 'completed') return;
        setMarks(prev => ({
            ...prev,
            [teamId]: {
                ...prev[teamId],
                [field]: value
            }
        }));
    };

    const startEditing = (teamId) => {
        setEditingTeamId(teamId);
    };

    const cancelEditing = (teamId) => {
        setEditingTeamId(null);
        // Ideally revert changes? For now, we just exit edit mode. 
        // Re-fetching could be safer to revert unsaved inputs:
        fetchEventAndTeams();
    };

    const saveRow = async (teamId) => {
        // Validation?
        setSaving(true);
        try {
            await api.put(`/api/events/${eventId}/registrations/${teamId}/marks`, {
                marks: JSON.stringify(marks[teamId])
            });
            alert('Marks updated successfully!');
            setEditingTeamId(null);
        } catch (error) {
            console.error('Failed to save marks:', error);
            alert('Failed to save marks.');
        } finally {
            setSaving(false);
        }
    };

    const calculateTotal = (teamMarks) => {
        if (!teamMarks) return 0;
        const innovation = parseFloat(teamMarks.innovation) || 0;
        const feasibility = parseFloat(teamMarks.feasibility) || 0;
        const statistics = parseFloat(teamMarks.statistics) || 0;
        const revenue = parseFloat(teamMarks.revenue) || 0;
        return (innovation + feasibility + statistics + revenue).toFixed(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Send marks structure as is (backend should handle JSON stringification if needed)
            await api.post(`/api/events/${eventId}/marks`, { marks });
            alert('Marks saved successfully!');
            navigate('/admin/dashboard');
        } catch (error) {
            console.error('Failed to save marks:', error);
            alert('Failed to save marks. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader text="Loading event details..." />;

    if (!event) {
        return (
            <div className="card">
                <p className="text-muted">Event not found</p>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', paddingBottom: 'var(--spacing-lg)' }}>
            <form onSubmit={handleSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                    {/* Header Section */}
                    <div style={{ padding: 'var(--spacing-xl)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/admin/dashboard')}
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            ← Back
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{event.title}</h1>
                            <p className="text-muted" style={{ margin: 0 }}>Enter marks for registered teams</p>
                        </div>
                    </div>

                    {/* Content Section */}
                    {teams.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p className="text-muted">No teams registered for this event yet</p>
                        </div>
                    ) : (
                        <div style={{ flex: 1, overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 10 }}>Team Name</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 10, width: '12%' }}>Innovation</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 10, width: '12%' }}>Feasibility</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 10, width: '12%' }}>Statistics</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 10, width: '12%' }}>Revenue</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 10, width: '8%' }}>Total</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 10, width: '20%' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map(team => {
                                        const isEditing = editingTeamId === team.id;
                                        const isCompleted = event?.status === 'completed';

                                        return (
                                            <tr key={team.id} style={{ borderBottom: '1px solid var(--color-border)', background: isEditing ? 'rgba(56, 189, 248, 0.05)' : 'transparent' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500 }}>
                                                    {team.team_name}
                                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{team.leader_name}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="25"
                                                        disabled={!isEditing || isCompleted}
                                                        value={marks[team.id]?.innovation || ''}
                                                        onChange={(e) => handleMarkChange(team.id, 'innovation', e.target.value)}
                                                        placeholder="0-25"
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: (!isEditing || isCompleted) ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)', color: 'var(--color-text)', opacity: (!isEditing || isCompleted) ? 0.7 : 1 }}
                                                    />
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="25"
                                                        disabled={!isEditing || isCompleted}
                                                        value={marks[team.id]?.feasibility || ''}
                                                        onChange={(e) => handleMarkChange(team.id, 'feasibility', e.target.value)}
                                                        placeholder="0-25"
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: (!isEditing || isCompleted) ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)', color: 'var(--color-text)', opacity: (!isEditing || isCompleted) ? 0.7 : 1 }}
                                                    />
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="25"
                                                        disabled={!isEditing || isCompleted}
                                                        value={marks[team.id]?.statistics || ''}
                                                        onChange={(e) => handleMarkChange(team.id, 'statistics', e.target.value)}
                                                        placeholder="0-25"
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: (!isEditing || isCompleted) ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)', color: 'var(--color-text)', opacity: (!isEditing || isCompleted) ? 0.7 : 1 }}
                                                    />
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="25"
                                                        disabled={!isEditing || isCompleted}
                                                        value={marks[team.id]?.revenue || ''}
                                                        onChange={(e) => handleMarkChange(team.id, 'revenue', e.target.value)}
                                                        placeholder="0-25"
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: (!isEditing || isCompleted) ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)', color: 'var(--color-text)', opacity: (!isEditing || isCompleted) ? 0.7 : 1 }}
                                                    />
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                    {calculateTotal(marks[team.id])}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    {!isCompleted && (
                                                        isEditing ? (
                                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => saveRow(team.id)}
                                                                    className="btn btn-primary"
                                                                    disabled={saving}
                                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                                                                >
                                                                    {saving ? '...' : 'Save'}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => cancelEditing(team.id)}
                                                                    className="btn btn-secondary"
                                                                    disabled={saving}
                                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => startEditing(team.id)}
                                                                className="btn btn-secondary"
                                                                style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', borderColor: 'var(--color-border)' }}
                                                            >
                                                                Edit
                                                            </button>
                                                        )
                                                    )}
                                                    {isCompleted && <span className="text-muted" style={{ fontSize: '0.9rem' }}>Locked</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer Section Removed - saving is now per-row */}
                </div>
            </form>
        </div>
    );
};

export default JuryMarking;
