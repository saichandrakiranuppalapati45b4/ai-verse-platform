import { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';

const TeamManager = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        role: '',
        department: '',
        bio: '',
        linkedin_url: '',
        github_url: '',
        display_order: 0,
        is_visible: true
    });
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const response = await api.get('/api/team/all');
            setMembers(response.data.team);
        } catch (err) {
            console.error('Failed to fetch team members:', err);
            setError('Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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
            role: '',
            department: '',
            bio: '',
            linkedin_url: '',
            github_url: '',
            display_order: 0,
            is_visible: true
        });
        setImageFile(null);
        setError(null);
    };

    const DEPARTMENTS = [
        "Communication team",
        "Design team",
        "PR team",
        "Technical team",
        "Videography team",
        "Photography team",
        "Editing team",
        "Logistics & Operation team",
        "Social media handling"
    ];

    const openAddModal = () => {
        resetForm();
        setFormData(prev => ({ ...prev, department: DEPARTMENTS[0] })); // Default to first
        setShowModal(true);
    };

    const openEditModal = (member) => {
        setFormData({
            id: member.id,
            name: member.name,
            role: member.role,
            department: member.department || DEPARTMENTS[0],
            bio: member.bio || '',
            linkedin_url: member.linkedin_url || '',
            github_url: member.github_url || '',
            display_order: member.display_order,
            is_visible: member.is_visible
        });
        setImageFile(null);
        setError(null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError(null);

        try {
            let memberId = formData.id;

            // Create FormData object for multipart/form-data request
            const data = new FormData();
            data.append('name', formData.name);
            data.append('role', formData.role);
            data.append('department', formData.department);
            if (formData.bio) data.append('bio', formData.bio);
            if (formData.linkedin_url) data.append('linkedin_url', formData.linkedin_url);
            if (formData.github_url) data.append('github_url', formData.github_url);
            data.append('display_order', formData.display_order);
            data.append('is_visible', formData.is_visible);

            if (imageFile) {
                data.append('image', imageFile);
            }

            // 1. Create or Update Member
            if (memberId) {
                // For updates, we still use JSON for fields usually, but let's stick to API routes.
                // The PUT route currently expects JSON. 
                // Wait, if we want to update image too in one go, PUT should also support multipart.
                // For now, let's keep PUT as is (JSON Only) and handle image separate for EDIT, 
                // but use new method for CREATE.

                await api.put(`/api/team/${memberId}`, formData);

                // Upload Image if selected during edit
                if (imageFile) {
                    const imageFormData = new FormData();
                    imageFormData.append('image', imageFile);
                    await api.post(`/api/team/${memberId}/upload-image`, imageFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
            } else {
                // CREATE: Use single multipart request
                await api.post('/api/team', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setShowModal(false);
            fetchMembers();
        } catch (err) {
            console.error('Submit error:', err);
            setError(err.response?.data?.error || 'Failed to save team member');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this team member?')) return;

        try {
            await api.delete(`/api/team/${id}`);
            fetchMembers();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete team member');
        }
    };

    if (loading) return <Loader text="Loading team members..." />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>Team Manager</h1>
                    <p className="text-muted">Manage your team members and departments</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    + Add Member
                </button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div className="card">
                {members.length === 0 ? (
                    <div className="text-center" style={{ padding: '2rem' }}>
                        <p className="text-muted">No team members yet. Click "Add Member" to get started.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Profile</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Department</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(member => (
                                <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        {member.profile_image_url ? (
                                            <img
                                                src={`${api.defaults.baseURL}${member.profile_image_url}`}
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
                                                👤
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{member.name}</td>
                                    <td style={{ padding: '1rem' }}>{member.role}</td>
                                    <td style={{ padding: '1rem' }}>{member.department}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.8rem',
                                            background: member.is_visible ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                            color: member.is_visible ? 'var(--color-success)' : 'var(--color-text-muted)'
                                        }}>
                                            {member.is_visible ? 'Visible' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
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

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card animate-scale-in" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{formData.id ? 'Edit Member' : 'Add Team Member'}</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Role *</label>
                                <input
                                    type="text"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g. Technical Lead"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Department *</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="" disabled>Select Department</option>
                                    {DEPARTMENTS.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Bio (Optional)</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="Short bio..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Profile Image (Optional) {formData.id && '(Leave empty to keep current)'}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="form-label">LinkedIn URL (Optional)</label>
                                    <input
                                        type="url"
                                        name="linkedin_url"
                                        value={formData.linkedin_url}
                                        onChange={handleInputChange}
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">GitHub URL (Optional)</label>
                                    <input
                                        type="url"
                                        name="github_url"
                                        value={formData.github_url}
                                        onChange={handleInputChange}
                                        placeholder="https://github.com/..."
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    name="is_visible"
                                    checked={formData.is_visible}
                                    onChange={handleInputChange}
                                    id="is_visible"
                                />
                                <label htmlFor="is_visible" style={{ marginBottom: 0, cursor: 'pointer' }}>
                                    Visible on website
                                </label>
                            </div>

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
        </div>
    );
};

export default TeamManager;
