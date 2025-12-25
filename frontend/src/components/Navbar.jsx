import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="container">
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <h2 className="gradient-text">AI Verse</h2>
                </Link>
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/about">About</Link>
                    <Link to="/events">Events</Link>
                    <Link to="/live">Live</Link>
                    <Link to="/gallery">Gallery</Link>
                    <Link to="/team">Team</Link>
                    <Link to="/contact">Contact</Link>
                    <Link to="/admin/login" className="btn btn-primary btn-sm">LOGIN</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
