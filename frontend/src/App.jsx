import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Public pages
import Home from './pages/Home';
import About, { Gallery, Contact } from './pages/About';
import Events from './pages/Events';
import LiveEvents from './pages/LiveEvents';
import Team from './pages/Team';
import Register from './pages/Register';

// Admin pages
import AdminLogin from './admin/Login';
import AdminLayout from './admin/Layout';
import Dashboard from './admin/Dashboard';
import HomeManager from './admin/HomeManager';
import AboutManager from './admin/AboutManager';
import EventsManager from './admin/EventsManager';
import LiveEventsController from './admin/LiveEventsController';
import GalleryManager from './admin/GalleryManager';
import TeamManager from './admin/TeamManager';
import AdminManagement from './admin/AdminManagement';
import JuryManager from './admin/JuryManager';
import JuryMarking from './admin/JuryMarking';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/live" element={<LiveEvents />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/contact" element={<Contact />} />

                    {/* Admin Login */}
                    <Route path="/admin/login" element={<AdminLogin />} />

                    {/* Admin Routes */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute>
                                <ErrorBoundary>
                                    <AdminLayout />
                                </ErrorBoundary>
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route
                            path="home"
                            element={
                                <ProtectedRoute requiredPermission="home">
                                    <HomeManager />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="about"
                            element={
                                <ProtectedRoute requiredPermission="about">
                                    <AboutManager />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="events"
                            element={
                                <ProtectedRoute requiredPermission="events">
                                    <EventsManager />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="live-events"
                            element={
                                <ProtectedRoute requiredPermission="live_events">
                                    <LiveEventsController />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="gallery"
                            element={
                                <ProtectedRoute requiredPermission="gallery">
                                    <GalleryManager />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="team"
                            element={
                                <ProtectedRoute requiredPermission="team">
                                    <TeamManager />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="jury"
                            element={
                                <ProtectedRoute requiredPermission="events">
                                    <JuryManager />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="admins"
                            element={
                                <ProtectedRoute>
                                    <AdminManagement />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* Jury Marking - Standalone Full Screen Route */}
                    <Route
                        path="/admin/jury/marking/:eventId"
                        element={
                            <ProtectedRoute>
                                <div style={{ height: '100vh', background: 'var(--color-bg-primary)', padding: 'var(--spacing-lg)', boxSizing: 'border-box' }}>
                                    <JuryMarking />
                                </div>
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
