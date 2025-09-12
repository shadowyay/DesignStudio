import React, { useState } from 'react';

interface FeedbackProps {
  theme: 'user' | 'volunteer';
}

const themeStyles = {
  user: {
    container: 'bg-blue-50 border-blue-400',
    title: 'text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  volunteer: {
    container: 'bg-green-50 border-green-400',
    title: 'text-green-700',
    button: 'bg-green-600 hover:bg-green-700 text-white',
  },
};

const Feedback: React.FC<FeedbackProps> = ({ theme }) => {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // TODO: Optionally send feedback to backend
  };

  return (
    <div className={`border rounded-lg p-6 my-6 shadow-sm ${themeStyles[theme].container}`}>
      <h2 className={`text-xl font-semibold mb-2 ${themeStyles[theme].title}`}>We value your feedback!</h2>
      {submitted ? (
        <p className="text-sm text-gray-600">Thank you for your feedback!</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-opacity-50"
            rows={4}
            placeholder="Share your thoughts..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            required
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded ${themeStyles[theme].button}`}
          >
            Submit Feedback
          </button>
        </form>
      )}
    </div>
  );
};

export default Feedback;
