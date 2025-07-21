import React, { useState } from 'react';

type AuthFormProps = {
  isVolunteer?: boolean;
};

const AuthForm: React.FC<AuthFormProps> = ({ isVolunteer }) => {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <main style={{ maxWidth: 400, margin: '40px auto', lineHeight: 1.8 }}>
      {!showRegister ? (
        <section className="section active">
          <h2>Login</h2>
          <form>
            <label>Email:</label>
            <input type="email" name="email" required />
            <label>Password:</label>
            <input type="password" name="password" required />
            <button type="submit" className="get-started">Login</button>
          </form>
          <p>
            Don't have an account? <a href="#" onClick={e => {e.preventDefault(); setShowRegister(true);}}>Create an account</a>
          </p>
        </section>
      ) : (
        <section className="section">
          <h2>Register</h2>
          <form>
            <label>Full Name:</label>
            <input type="text" name="name" required />
            <label>Date of Birth:</label>
            <input type="date" name="dob" required />
            <label>Email:</label>
            <input type="email" name="email" required />
            <label>Phone Number:</label>
            <input type="tel" name="phone" pattern="[0-9]{10}" title="Enter a 10-digit number" required />
            <label>Password:</label>
            <input type="password" name="password" required />
            <small>Password must be at least 8 characters with letters and numbers.</small>
            <label>Location:</label>
            <input type="text" name="location" required />
            {isVolunteer && (
              <>
                <label>What can you volunteer for?</label>
                <input type="text" name="skills" placeholder="e.g. Teaching, Cleaning, Organizing" required />
                <label>Or open to anything?</label>
                <select name="openToAnything">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </>
            )}
            <button type="submit" className="get-started">Sign Up</button>
          </form>
          <p>
            Already have an account? <a href="#" onClick={e => {e.preventDefault(); setShowRegister(false);}}>Back to Login</a>
          </p>
        </section>
      )}
    </main>
  );
};

export default AuthForm;
