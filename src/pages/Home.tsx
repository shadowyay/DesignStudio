import React, { useState } from 'react';
import RoleModal from '../components/RoleModal';

const Home: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header>
        <h1>Micro Volunteer Platform</h1>
        <nav>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <a href="#support">Support</a>
        </nav>
      </header>
      <main>
        <section id="home" className="section active">
          <h2>Welcome to the Micro Volunteer Platform</h2>
          <p>Connecting volunteers and those in need with ease and efficiency.</p>
          <button className="get-started" onClick={() => setModalOpen(true)}>Get Started</button>
        </section>
        <section id="about" className="section active">
          <h2>About</h2>
          <h2>Welcome to the Micro Volunteer Platform</h2>
          <p>Connecting volunteers and those in need with ease and efficiency.</p>
        </section>
        <section id="contact" className="section active">
          <h2>Contact</h2>
          <h2>Welcome to the Micro Volunteer Platform</h2>
          <p>Connecting volunteers and those in need with ease and efficiency.</p>
        </section>
        <section id="support" className="section active">
          <h2>Support</h2>
          <h2>Welcome to the Micro Volunteer Platform</h2>
          <p>Connecting volunteers and those in need with ease and efficiency.</p>
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
