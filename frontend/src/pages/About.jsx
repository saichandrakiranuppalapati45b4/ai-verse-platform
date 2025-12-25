// Placeholder public pages
import { Link } from 'react-router-dom';
import './PublicPages.css';

const NavBar = () => (
    <nav className="navbar">
        <div className="container">
            <h2 className="gradient-text">AI Verse</h2>
            <div className="nav-links">
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/events">Events</Link>
                <Link to="/live">Live</Link>
                <Link to="/gallery">Gallery</Link>
                <Link to="/team">Team</Link>
                <Link to="/contact">Contact</Link>
            </div>
        </div>
    </nav>
);

export const About = () => (
    <div className="public-page">
        <NavBar />
        <div className="container" style={{ paddingTop: 'var(--spacing-3xl)' }}>
            <h1>About AI Verse</h1>
            <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
                <p>AI Verse is the premier CSE club focused on Artificial Intelligence and Data Science.</p>
            </div>
        </div>
    </div>
);

export const Events = () => (
    <div className="public-page">
        <NavBar />
        <div className="container" style={{ paddingTop: 'var(--spacing-3xl)' }}>
            <h1>Events</h1>
            <p className="text-muted">Browse our upcoming and past events</p>
        </div>
    </div>
);

export const LiveEvents = () => (
    <div className="public-page">
        <NavBar />
        <div className="container" style={{ paddingTop: 'var(--spacing-3xl)' }}>
            <h1>Live Events</h1>
            <p className="text-muted">No live events at the moment</p>
        </div>
    </div>
);

export const Gallery = () => (
    <div className="public-page">
        <NavBar />
        <div className="container" style={{ paddingTop: 'var(--spacing-3xl)' }}>
            <h1>Gallery</h1>
            <p className="text-muted">View our collection of images and videos</p>
        </div>
    </div>
);

export const Team = () => (
    <div className="public-page">
        <NavBar />
        <div className="container" style={{ paddingTop: 'var(--spacing-3xl)' }}>
            <h1>Our Team</h1>
            <p className="text-muted">Meet the AI Verse team</p>
        </div>
    </div>
);

export const Contact = () => (
    <div className="public-page">
        <NavBar />
        <div className="container" style={{ paddingTop: 'var(--spacing-3xl)' }}>
            <h1>Contact Us</h1>
            <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
                <p>Get in touch with AI Verse</p>
            </div>
        </div>
    </div>
);

export default About;
