import React, { useState } from 'react';
import RoleModal from '../components/RoleModal';

const Home: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-700 tracking-tight">Micro Volunteer Platform</h1>
          <nav className="space-x-6">
            <a href="#home" className="text-gray-700 hover:text-blue-600 font-medium transition">Home</a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition">About</a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition">Contact</a>
            <a href="#support" className="text-gray-700 hover:text-blue-600 font-medium transition">Support</a>
          </nav>
        </div>
      </header>
      <main className={`bg-gradient-to-br from-blue-50 to-white min-h-screen pb-10 transition-filter duration-300 ${modalOpen ? 'filter blur-sm pointer-events-none select-none' : ''}`}>
        <section id="home" className="flex flex-col items-center justify-center text-center py-24 px-4 animate-fadeIn animate-slideUp">
          <h2 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-4">Welcome to the Micro Volunteer Platform</h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">Connecting volunteers and those in need with ease and efficiency.</p>
          <button className="px-8 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 text-lg font-semibold active:scale-95" onClick={() => setModalOpen(true)}>Get Started</button>
        </section>
        <section id="about" className="max-w-4xl mx-auto py-16 px-4 animate-fadeIn animate-slideUp">
          <h2 className="text-3xl font-bold text-blue-700 mb-4">About</h2>
          <p className="text-gray-700 text-lg">The Micro Volunteer Platform connects people who need help with volunteers ready to offer support. Post tasks, accept opportunities, and make a difference in your community.</p>
        </section>
        <section id="contact" className="max-w-4xl mx-auto py-16 px-4 animate-fadeIn animate-slideUp">
          <h2 className="text-3xl font-bold text-blue-700 mb-4">Contact</h2>
          <p className="text-gray-700 text-lg">Have questions or need support? Reach out to us at <a href="mailto:support@microvolunteer.com" className="text-blue-600 underline">support@microvolunteer.com</a>.</p>
        </section>
        <section id="support" className="max-w-4xl mx-auto py-16 px-4 animate-fadeIn animate-slideUp">
          <h2 className="text-3xl font-bold text-blue-700 mb-4">Support</h2>
          <p className="text-gray-700 text-lg">We are here to help you. Visit our FAQ or contact our support team for assistance.</p>
        </section>
      </main>
      <RoleModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <footer className="bg-blue-900 text-white text-center py-6 mt-10">
        &copy; 2025 Micro Volunteer Platform
      </footer>
    </>
  );
};

export default Home;
