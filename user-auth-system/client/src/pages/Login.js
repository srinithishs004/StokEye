import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const { login, error, user } = useAuth();
  const navigate = useNavigate();

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      console.log('Submitting login form with email:', email);
      
      // Login user
      const success = await login({ email, password });
      console.log('Login result:', success);
      
      if (success) {
        console.log('Login successful, user:', user);
        
        // Small delay to ensure user state is updated
        setTimeout(() => {
          // Redirect based on user role
          if (user && user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 100);
      } else {
        // If login failed but no error was set in the auth context
        if (!error) {
          setFormError('Login failed. Please check your credentials.');
        } else {
          setFormError(error);
        }
      }
    } catch (err) {
      console.error('Login submission error:', err);
      setFormError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2 className="text-center mb-4">Login</h2>
      
      {formError && (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      )}
      
      {error && !formError && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
        </div>
        
        <button type="submit" className="btn btn-primary w-100">Login</button>
      </form>
      
      <div className="auth-link mt-3">
        Don't have an account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
};

export default Login;