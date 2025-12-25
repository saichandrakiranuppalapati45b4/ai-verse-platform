import { Link } from 'react-router-dom';
import './PublicPages.css';
import Navbar from '../components/Navbar';

const Home = () => {
    return (
        <div className="public-page">
            <Navbar />

            <section className="hero">
                <div className="container text-center">
                    <h1 className="hero-title gradient-text animate-fade-in">Welcome to AI Verse</h1>
                    <p className="hero-subtitle animate-slide-up">Empowering Innovation Through Artificial Intelligence & Data Science</p>
                    <div className="hero-actions animate-slide-up">
                        <Link to="/events" className="btn btn-primary btn-lg">Explore Events</Link>
                        <Link to="/about" className="btn btn-secondary btn-lg">Learn More</Link>
                    </div>
                </div>
            </section>

            <section className="features container">
                <div className="grid grid-3">
                    <div className="card">
                        <h3>🎯 Hackathons</h3>
                        <p>Participate in exciting hackathons and showcase your AI skills.</p>
                    </div>
                    <div className="card">
                        <h3>🧠 Workshops</h3>
                        <p>Learn from industry experts in hands-on AI and ML workshops.</p>
                    </div>
                    <div className="card">
                        <h3>🚀 Projects</h3>
                        <p>Collaborate on real-world AI projects with your peers.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
