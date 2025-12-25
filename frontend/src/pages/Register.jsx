import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const [searchParams] = useSearchParams();
    const eventName = searchParams.get('event') || '';
    const eventId = searchParams.get('eventId');

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        teamName: '',
        teamSize: 1,
        event: eventName,
        teamLeadName: '',
        teamLeadEmail: '',
        teamLeadPhone: '',
        teamMembers: []
    });

    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('=== REGISTRATION SUBMIT STARTED ===');
        console.log('Event ID:', eventId);
        console.log('Form Data:', formData);

        if (!eventId) {
            console.error('Missing event ID!');
            setError('Invalid event ID. Please try accessing this page from the Events list.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                team_name: formData.teamName,
                team_size: parseInt(formData.teamSize),
                team_lead_name: formData.teamLeadName,
                team_lead_email: formData.teamLeadEmail,
                team_lead_phone: formData.teamLeadPhone,
                members: formData.teamMembers
            };

            console.log('Payload:', payload);
            console.log('API URL:', `/api/events/${eventId}/register`);

            const response = await api.post(`/api/events/${eventId}/register`, payload);
            console.log('Registration successful:', response.data);
            setSubmitted(true);
        } catch (err) {
            console.error('Registration failed:', err);
            console.error('Error response:', err.response);
            const errorMessage = err.response?.data?.error ||
                (err.response?.data?.errors ? err.response.data.errors.map(e => e.msg).join(', ') : 'Registration failed. Please try again.');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = (e) => {
        e.preventDefault();
        setError(null);


        if (formData.teamName && formData.teamSize > 0) {
            const membersCount = Math.max(0, parseInt(formData.teamSize) - 1);
            console.log('handleNext: Target membersCount:', membersCount);

            const currentMembers = [...formData.teamMembers];

            // Check if we need to migrate from strings to objects (legacy data fix)
            const hasLegacyStrings = currentMembers.some(m => typeof m === 'string');
            const sizeChanged = currentMembers.length !== membersCount;

            if (sizeChanged || hasLegacyStrings) {
                console.log('handleNext: Reinitializing members array...');
                const newMembers = Array(membersCount).fill(null).map((_, i) => {
                    const existing = currentMembers[i];
                    // Preserve existing object data if valid, otherwise create new
                    if (existing && typeof existing === 'object') return existing;
                    return { name: '', email: '', phone: '' };
                });
                console.log('handleNext: New members array:', newMembers);
                setFormData(prev => ({ ...prev, teamMembers: newMembers }));
            } else {
                console.log('handleNext: Members array size matches, no change.');
            }

            setStep(2);
        } else {
            alert('Please fill in valid Team Name and Team Size');
        }
    };

    const handleMemberChange = (index, field, value) => {
        const updatedMembers = [...formData.teamMembers];
        updatedMembers[index] = { ...updatedMembers[index], [field]: value };
        setFormData({ ...formData, teamMembers: updatedMembers });
    };

    return (
        <div className="public-page">
            <Navbar />
            <div className="container" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '120px' }}>
                <div className="card animate-fade-in" style={{ padding: '2.5rem' }}>

                    {!submitted ? (
                        <>
                            <header className="text-center mb-xl">
                                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Team Registration</h1>
                                <p className="text-muted">
                                    {step === 1 ? 'Step 1: Team Info' : 'Step 2: Member Details'}
                                </p>
                                {error && (
                                    <div className="alert alert-error animate-shake" style={{ marginTop: '1rem' }}>
                                        {error}
                                    </div>
                                )}
                            </header>

                            <form onSubmit={handleSubmit}>
                                {step === 1 ? (
                                    <div className="animate-slide-up">
                                        {/* Step 1 Fields */}
                                        <div className="form-group">
                                            <label className="form-label">Event Name</label>
                                            <input
                                                type="text"
                                                name="event"
                                                className="form-input"
                                                value={formData.event}
                                                disabled
                                                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Team Name</label>
                                            <input
                                                type="text"
                                                name="teamName"
                                                required
                                                className="form-input"
                                                placeholder="e.g. The AI Wizards"
                                                value={formData.teamName}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Team Size (Including Lead)</label>
                                            <input
                                                type="number"
                                                name="teamSize"
                                                required
                                                min="1"
                                                max="10"
                                                className="form-input"
                                                value={formData.teamSize}
                                                onChange={handleChange}
                                            />
                                            <small className="text-muted">Enter total number of members</small>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="btn btn-primary btn-lg"
                                            style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            Next ➡️
                                        </button>
                                    </div>
                                ) : (
                                    <div className="animate-slide-up">
                                        {/* Step 2 Fields */}
                                        <div className="form-group">
                                            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Team Lead</h3>
                                            <div className="form-group">
                                                <label className="form-label">Lead Name</label>
                                                <input
                                                    type="text"
                                                    name="teamLeadName"
                                                    required
                                                    className="form-input"
                                                    placeholder="Team Lead Name"
                                                    value={formData.teamLeadName}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Lead Email</label>
                                                <input
                                                    type="email"
                                                    name="teamLeadEmail"
                                                    required
                                                    className="form-input"
                                                    placeholder="lead@example.com"
                                                    value={formData.teamLeadEmail}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Lead Phone Number</label>
                                                <input
                                                    type="tel"
                                                    name="teamLeadPhone"
                                                    required
                                                    className="form-input"
                                                    placeholder="+91 1234567890"
                                                    value={formData.teamLeadPhone}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        {formData.teamMembers.length > 0 && (
                                            <div className="form-group">
                                                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Team Members</h3>
                                                {formData.teamMembers.map((member, index) => (
                                                    <div key={index} className="form-group" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                                                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary)' }}>Member {index + 1}</h4>

                                                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                                            <label className="form-label">Name</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                className="form-input"
                                                                placeholder={`Member ${index + 1} Name`}
                                                                value={member.name}
                                                                onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                                            <label className="form-label">Email</label>
                                                            <input
                                                                type="email"
                                                                required
                                                                className="form-input"
                                                                placeholder={`member${index + 1}@example.com`}
                                                                value={member.email}
                                                                onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                                            <label className="form-label">Phone</label>
                                                            <input
                                                                type="tel"
                                                                required
                                                                className="form-input"
                                                                placeholder="+91 1234567890"
                                                                value={member.phone}
                                                                onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="btn btn-secondary"
                                                style={{ flex: 1 }}
                                            >
                                                ⬅️ Back
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary btn-lg"
                                                disabled={loading}
                                                style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                {loading ? 'Registering...' : 'Complete Registration 🚀'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </>
                    ) : (
                        <div className="text-center animate-scale-in" style={{ padding: '2rem 0' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                            <h2 className="mb-md">Registration Successful!</h2>
                            <p className="text-muted mb-lg">
                                Team <strong>{formData.teamName}</strong> has been registered.<br />
                                Confirmation sent to {formData.teamLeadEmail}.
                            </p>
                            <a href="/events" className="btn btn-secondary">Browse More Events</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
