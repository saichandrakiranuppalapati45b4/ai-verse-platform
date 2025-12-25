import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import Loader from '../components/Loader';

const Team = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const response = await api.get('/api/team');
            setTeamMembers(response.data.team);
        } catch (err) {
            console.error('Failed to fetch team members:', err);
            setError('Failed to load team members. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader text="Loading team..." />;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-text)' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
                <div className="text-center animate-fade-in" style={{ marginBottom: '4rem' }}>
                    <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Our Team</h1>
                    <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                        Meet the brilliant minds driving innovation at AI Verse.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error text-center">
                        {error}
                    </div>
                )}

                {!loading && !error && teamMembers.length === 0 && (
                    <div className="text-center text-muted" style={{ padding: '4rem' }}>
                        <p>No team members found.</p>
                    </div>
                )}

                {/* Group terms by department */}
                {[...new Set(teamMembers.map(m => m.department || 'General Team'))].sort().map(dept => {
                    const deptMembers = teamMembers.filter(m => (m.department || 'General Team') === dept);
                    if (deptMembers.length === 0) return null;

                    return (
                        <div key={dept} style={{ marginBottom: '4rem' }}>
                            <h2 style={{
                                fontSize: '2rem',
                                marginBottom: '2rem',
                                paddingLeft: '1rem',
                                borderLeft: '4px solid var(--color-primary)',
                                color: 'white'
                            }}>
                                {dept}
                            </h2>

                            <div className="team-scroll-container scrollbar-hide" style={{
                                display: 'flex',
                                gap: '2rem',
                                overflowX: 'auto',
                                paddingBottom: '2rem',
                                paddingRight: '1rem',
                                scrollSnapType: 'x mandatory',
                                WebkitOverflowScrolling: 'touch'
                            }}>
                                {deptMembers.map((member, index) => (
                                    <div
                                        key={member.id}
                                        className="card animate-slide-up"
                                        style={{
                                            flex: '0 0 auto',
                                            width: '300px',
                                            scrollSnapAlign: 'start',
                                            animationDelay: `${index * 100}ms`,
                                            padding: '0',
                                            overflow: 'hidden',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <div style={{
                                            height: '250px',
                                            background: 'linear-gradient(45deg, var(--color-primary), var(--color-secondary))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {member.profile_image_url ? (
                                                <img
                                                    src={`${api.defaults.baseURL}${member.profile_image_url}`}
                                                    alt={member.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{ fontSize: '4rem' }}>👤</div>
                                            )}
                                        </div>

                                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{ marginBottom: '0.5rem' }}>{member.name}</h3>
                                            <p style={{
                                                color: 'var(--color-primary)',
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                marginBottom: '0.2rem'
                                            }}>
                                                {member.role.toUpperCase()}
                                            </p>

                                            {/* Department is now in the section header, so we can hide it or keep it as subtitle if desired. Keeping it for clarity but making it subtle. */}
                                            {/* {member.department && (
                                                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                                                    {member.department}
                                                </p>
                                            )} */}

                                            {member.bio && (
                                                <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                                                    {member.bio}
                                                </p>
                                            )}

                                            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                                                {member.linkedin_url && (
                                                    <a
                                                        href={member.linkedin_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ flex: 1, textAlign: 'center' }}
                                                    >
                                                        LinkedIn
                                                    </a>
                                                )}
                                                {member.github_url && (
                                                    <a
                                                        href={member.github_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ flex: 1, textAlign: 'center' }}
                                                    >
                                                        GitHub
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Team;
