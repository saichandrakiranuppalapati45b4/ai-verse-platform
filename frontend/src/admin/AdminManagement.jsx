import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';

const MODULES = [
    { id: 'home', label: 'Home Page' },
    { id: 'about', label: 'About Page' },
    { id: 'events', label: 'Events' },
    { id: 'live_events', label: 'Live Events' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'team', label: 'Team' }
];

const AdminManagement = () => {
    const { isSuperAdmin, user: currentUser } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        permissions: [] // Array of module IDs
    });

    useEffect(() => {
        if (isSuperAdmin) {
            fetchAdmins();
        } else {
            setLoading(false);
        }
    }, [isSuperAdmin]);

    const fetchAdmins = async () => {
        try {
            const response = await api.get('/api/admins');
            setAdmins(response.data.admins);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch admins:', err);
            setError('Failed to load admins');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePermissionChange = (moduleId) => {
        setFormData(prev => {
            const currentPermissions = prev.permissions || [];
            if (currentPermissions.includes(moduleId)) {
                return { ...prev, permissions: currentPermissions.filter(id => id !== moduleId) };
            } else {
                return { ...prev, permissions: [...currentPermissions, moduleId] };
            }
        });
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({ username: '', email: '', password: '', permissions: [] });
        setShowModal(true);
    };

    const openEditModal = (admin) => {
        setIsEditing(true);
        setEditId(admin.id);
        setFormData({
            username: admin.username,
            email: admin.email,
            password: '', // Leave empty to keep unchanged
            permissions: admin.permissions || []
        });
        setShowModal(true);
    };

    const [submitLoading, setSubmitLoading] = useState(false);
    const [modalError, setModalError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setModalError(null);

        try {
            if (isEditing) {
                // Update Admin
                const updateData = {
                    permissions: formData.permissions
                    // For now, we only update permissions here. Password reset is separate.
                };
                await api.put(`/api/admins/${editId}`, updateData);
                alert('Admin updated successfully');
            } else {
                // Create Admin
                await api.post('/api/admins', formData);
                alert('Admin created successfully');
            }

            setShowModal(false);
            fetchAdmins();
        } catch (err) {
            console.error('Failed to save admin:', err);
            setModalError(err.response?.data?.error || 'Failed to save admin');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) return;

        try {
            await api.delete(`/api/admins/${id}`);
            fetchAdmins();
        } catch (err) {
            console.error('Failed to delete admin:', err);
            setError('Failed to delete admin');
        }
    };

    // Reset modal error when opening/closing
    useEffect(() => {
        if (!showModal) {
            setModalError(null);
        }
    }, [showModal]);

    if (!isSuperAdmin) {
        return (
            <div className="card text-center" style={{ padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                <h2>Access Restricted</h2>
                <p className="text-muted mb-lg">
                    This module is exclusively for Super Admins.
                </p>
                <div className="mb-lg p-md" style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
                    <p style={{ margin: 0 }}>Current Role: <strong style={{ color: 'var(--color-primary)' }}>Team Admin</strong></p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }} className="text-muted">Logged in as: {currentUser?.username}</p>
                </div>
                <div>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/admin/dashboard'}>
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (loading) return <Loader text="Loading admins..." />;

    return (
        <div>
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1>Admin Management</h1>
                    <p className="text-muted">Create and manage team admins</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    + Create Admin
                </button>
            </div>

            {error && <div className="alert alert-error mb-md">{error}</div>}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Username</th>
                                <th style={{ padding: '1rem' }}>Email</th>
                                <th style={{ padding: '1rem' }}>Role</th>
                                <th style={{ padding: '1rem' }}>Permissions</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted" style={{ padding: '2rem' }}>
                                        No admins found.
                                    </td>
                                </tr>
                            ) : (
                                admins.map(admin => (
                                    <tr key={admin.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 500 }}>{admin.username}</div>
                                            {currentUser?.id === admin.id && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>(You)</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>{admin.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '50px',
                                                background: admin.role === 'super_admin' ? 'rgba(var(--color-primary-rgb), 0.1)' : 'var(--color-bg-tertiary)',
                                                color: admin.role === 'super_admin' ? 'var(--color-primary)' : 'inherit',
                                                fontSize: '0.85rem',
                                                fontWeight: 500,
                                                border: `1px solid ${admin.role === 'super_admin' ? 'rgba(var(--color-primary-rgb), 0.2)' : 'var(--color-border)'}`
                                            }}>
                                                {admin.role === 'super_admin' ? 'Super Admin' : 'Team Admin'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {admin.role === 'super_admin' ? (
                                                <span className="text-muted">All Access</span>
                                            ) : (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {(!admin.permissions || admin.permissions.length === 0) && (
                                                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>None</span>
                                                    )}
                                                    {admin.permissions && admin.permissions.map(p => (
                                                        <span key={p} style={{
                                                            fontSize: '0.75rem',
                                                            background: 'var(--color-bg-secondary)',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            border: '1px solid var(--color-border)'
                                                        }}>
                                                            {MODULES.find(m => m.id === p)?.label || p}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {admin.role !== 'super_admin' && (
                                                <div className="flex gap-sm justify-end">
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => openEditModal(admin)}
                                                        title="Edit Permissions"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(admin.id)}
                                                        title="Delete Admin"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Admin Modal */}
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
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex justify-between items-center mb-lg">
                            <h2>{isEditing ? 'Edit Admin Permissions' : 'Create New Admin'}</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {modalError && <div className="alert alert-error mb-md">{modalError}</div>}

                            <div className="grid grid-2" style={{ gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isEditing} // Cannot change username
                                        placeholder="johndoe"
                                        style={isEditing ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isEditing} // Cannot change email here
                                        placeholder="john@example.com"
                                        style={isEditing ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                                    />
                                </div>
                            </div>

                            {!isEditing && (
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="text"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        minLength={6}
                                        placeholder="Minimum 6 characters"
                                    />
                                    <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                        Share this password securely with the new admin.
                                    </p>
                                </div>
                            )}

                            <div className="form-group mt-lg">
                                <label className="form-label mb-md" style={{ display: 'block' }}>Module Permissions</label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    {MODULES.map(module => (
                                        <label key={module.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions.includes(module.id)}
                                                onChange={() => handlePermissionChange(module.id)}
                                                style={{ width: '1.2rem', height: '1.2rem' }}
                                            />
                                            <span>{module.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-muted mt-sm" style={{ fontSize: '0.8rem' }}>
                                    Check the modules this admin is allowed to access and edit.
                                </p>
                            </div>

                            <div className="flex gap-md justify-end mt-xl">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitLoading}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                                    {submitLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Admin')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
