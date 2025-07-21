import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RoleModal from '../components/RoleModal';

const Home: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header>
        <h1>Micro Volunteer Platform</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/support">Support</Link>
        </nav>
      </header>
      <main>
        <section id="home" className="section active">
          <h2>Welcome to the Micro Volunteer Platform</h2>
          <p>Connecting volunteers and those in need with ease and efficiency.</p>
          <button className="get-started" onClick={() => setModalOpen(true)}>Get Started</button>
        </section>
      </main>
      <RoleModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <footer>
        &copy; 2025 Micro Volunteer Platform
      </footer>
    </>
  );
};

export default Home;
