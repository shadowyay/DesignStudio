import React, { useState, useEffect } from 'react';
import RoleModal from '../components/RoleModal';

const Home: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  useEffect(() => {
    // Enable smooth scrolling for the entire page
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const handleFAQToggle = (show: boolean) => {
    setShowFAQ(show);
    if (show) {
      // Scroll to FAQ section after a short delay to allow it to render
      setTimeout(() => {
        const faqSection = document.getElementById('faq');
        if (faqSection) {
          faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-700 tracking-tight">SmartServe</h1>
          <nav className="space-x-6">
            <a href="#home" className="text-gray-700 hover:text-blue-600 font-medium transition">Home</a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition">About</a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition">Contact</a>
            <a href="#support" className="text-gray-700 hover:text-blue-600 font-medium transition">Support</a>
            <button 
              onClick={() => handleFAQToggle(!showFAQ)} 
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              FAQ
            </button>
          </nav>
        </div>
      </header>
      <main className={`bg-gradient-to-br from-blue-50 to-white min-h-screen pb-10 transition-filter duration-300 ${modalOpen ? 'filter blur-sm pointer-events-none select-none' : ''}`}>
        <section id="home" className="flex flex-col items-center justify-center text-center py-24 px-4 animate-fadeIn animate-slideUp">
          <h2 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-4">Welcome to the SmartServe</h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">Connecting volunteers and those in need with ease and efficiency.</p>
          <button className="px-8 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 text-lg font-semibold active:scale-95" onClick={() => setModalOpen(true)}>Get Started</button>
        </section>
        <section id="about" className="max-w-4xl mx-auto py-16 px-4 animate-fadeIn animate-slideUp">
          <h2 className="text-3xl font-bold text-blue-700 mb-8 text-center">About SmartServe</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Our Mission</h3>
              <p className="text-gray-700 mb-4">SmartServe is a revolutionary micro-volunteering platform designed to bridge the gap between those who need assistance and compassionate volunteers ready to make a difference. We believe that small acts of kindness can create significant positive change in communities worldwide.</p>
              <p className="text-gray-700">Our platform facilitates meaningful connections by enabling users to post specific tasks and allowing volunteers to accept opportunities that match their skills, interests, and availability.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-4">How It Works</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                  <p className="text-gray-700">Users post tasks with detailed descriptions, location, and compensation details</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                  <p className="text-gray-700">Volunteers browse available opportunities and accept tasks that interest them</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                  <p className="text-gray-700">Both parties connect, complete the task, and build stronger communities together</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-600 mb-4">Why Choose SmartServe?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-xl">🤝</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Community Building</h4>
                <p className="text-gray-600 text-sm">Foster meaningful connections and strengthen local communities through mutual support</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-xl">⚡</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Quick & Easy</h4>
                <p className="text-gray-600 text-sm">Simple interface for posting tasks and finding opportunities that match your needs</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-xl">💰</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Fair Compensation</h4>
                <p className="text-gray-600 text-sm">Transparent payment system ensuring volunteers are fairly compensated for their time</p>
              </div>
            </div>
          </div>
        </section>
        <section id="contact" className="max-w-4xl mx-auto py-16 px-4 animate-fadeIn animate-slideUp">
          <h2 className="text-3xl font-bold text-blue-700 mb-8 text-center">Contact Us</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Get in Touch</h3>
              <p className="text-gray-700 mb-6">We're here to help! Whether you have questions about using the platform, need technical support, or want to provide feedback, our team is ready to assist you.</p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <span className="text-blue-600">📧</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Email Support</p>
                    <a href="mailto:support@smartserve.com" className="text-blue-600 hover:text-blue-800 transition">support@smartserve.com</a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <span className="text-blue-600">📱</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Phone Support</p>
                    <a href="tel:+1-800-SMARTSERVE" className="text-blue-600 hover:text-blue-800 transition">+1 (800) SMART-SERVE</a>
                  </div>
                </div>

              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Response Times</h3>
              <div className="space-y-3">
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <p className="font-semibold text-green-800">Urgent Issues</p>
                  <p className="text-green-700 text-sm">Response within 2-4 hours</p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="font-semibold text-blue-800">General Inquiries</p>
                  <p className="text-blue-700 text-sm">Response within 24 hours</p>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="font-semibold text-yellow-800">Feature Requests</p>
                  <p className="text-yellow-700 text-sm">Response within 48 hours</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="support" className="max-w-4xl mx-auto py-16 px-4 animate-fadeIn animate-slideUp">
          <h2 className="text-3xl font-bold text-blue-700 mb-8 text-center">Support & Resources</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Help Center</h3>
              <p className="text-gray-700 mb-6">Our comprehensive help center provides detailed guides, tutorials, and frequently asked questions to help you get the most out of SmartServe.</p>
              <div className="space-y-3">
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <h4 className="font-semibold text-gray-800 mb-2">Getting Started Guide</h4>
                  <p className="text-gray-600 text-sm mb-3">Learn how to create your first task or accept your first volunteer opportunity</p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Read Guide →</button>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <h4 className="font-semibold text-gray-800 mb-2">Safety Guidelines</h4>
                  <p className="text-gray-600 text-sm mb-3">Important safety tips for both task posters and volunteers</p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Guidelines →</button>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <h4 className="font-semibold text-gray-800 mb-2">Payment & Compensation</h4>
                  <p className="text-gray-600 text-sm mb-3">Understanding how payments work and ensuring fair compensation</p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Learn More →</button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Community Resources</h3>
              <p className="text-gray-700 mb-6">Join our community and access additional resources to enhance your volunteering experience.</p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <span className="text-blue-600">📚</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Volunteer Training</p>
                    <p className="text-gray-600 text-sm">Free online courses to improve your skills</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-full">
                    <span className="text-green-600">👥</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Community Forum</p>
                    <p className="text-gray-600 text-sm">Connect with other volunteers and share experiences</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <span className="text-purple-600">🏆</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Recognition Program</p>
                    <p className="text-gray-600 text-sm">Earn badges and recognition for your contributions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-600 mb-4 text-center">Need Help?</h3>
            <div className="text-center">
              <p className="text-gray-700 mb-4">Check our FAQ section below for quick answers, or contact our support team for personalized assistance.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => handleFAQToggle(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  View FAQ
                </button>
                <a href="#contact" className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold">
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </section>

        {showFAQ && (
          <section id="faq" className="max-w-4xl mx-auto py-16 px-4 animate-fadeIn animate-slideUp">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-blue-700">Frequently Asked Questions</h2>
              <button 
                onClick={() => handleFAQToggle(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition"
                aria-label="Close FAQ"
              >
                ×
              </button>
            </div>
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">How do I get started with SmartServe?</h3>
                <p className="text-gray-700">Getting started is easy! Simply click the "Get Started" button, choose your role (user or volunteer), create an account, and you'll be ready to post tasks or accept volunteer opportunities. The platform will guide you through the process step by step.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">What types of tasks can I post?</h3>
                <p className="text-gray-700">You can post a wide variety of tasks including household chores, errands, tutoring, pet care, gardening, moving assistance, tech support, and more. Be specific about what you need, when you need it, and any compensation you're offering.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">How does payment work?</h3>
                <p className="text-gray-700">When posting a task, you specify the amount you're willing to pay. Once a volunteer accepts and completes the task, you can arrange payment directly with them. We recommend using secure payment methods and always confirming task completion before payment.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">Is SmartServe safe to use?</h3>
                <p className="text-gray-700">Yes! We prioritize safety and security. All users are required to create verified accounts, and we encourage users to meet in public places for initial meetings. Always trust your instincts and report any suspicious activity to our support team.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">Can I cancel a task after posting it?</h3>
                <p className="text-gray-700">Yes, you can cancel a task if no volunteers have accepted it yet. Once a volunteer has accepted your task, you should communicate with them directly to discuss any changes or cancellations. Be respectful of their time and commitment.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">What if a volunteer doesn't show up?</h3>
                <p className="text-gray-700">If a volunteer doesn't show up or complete the task as agreed, you can report the issue through our platform. We take reliability seriously and will work with you to resolve the situation. You're not obligated to pay for incomplete work.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">How do I become a volunteer?</h3>
                <p className="text-gray-700">To become a volunteer, select "Volunteer" when creating your account. You can then browse available tasks in your area, filter by your interests and skills, and accept tasks that match your availability. Update your profile with your skills and experience to get better matches.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">What if I have a dispute with a user or volunteer?</h3>
                <p className="text-gray-700">We encourage open communication to resolve issues. If you can't reach a resolution, contact our support team with details about the situation. We'll review the case and help mediate the dispute to ensure a fair outcome for all parties involved.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">Is there a fee to use SmartServe?</h3>
                <p className="text-gray-700">SmartServe is free to use for both users and volunteers. We don't charge any platform fees or commissions. The compensation you agree upon goes directly between you and the volunteer, with no middleman taking a cut.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">How do I report inappropriate behavior?</h3>
                <p className="text-gray-700">If you encounter inappropriate behavior, harassment, or safety concerns, please report it immediately through our platform or contact support@smartserve.com. We take all reports seriously and will investigate promptly to maintain a safe community environment.</p>
              </div>
            </div>
          </section>
        )}
      </main>
      <RoleModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <footer className="bg-blue-900 text-white text-center py-6 mt-10">
        &copy; 2025 Micro Volunteer Platform
      </footer>
    </>
  );
};

export default Home;
