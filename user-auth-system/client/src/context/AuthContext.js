import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await axios.get('/api/auth/me');
          
          if (res.data.success) {
            setUser(res.data.user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        }
      } catch (err) {
        console.error('Authentication error:', err);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Register user
  const register = async (userData) => {
    setError(null);
    try {
      const res = await axios.post('/api/auth/register', userData);
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(res.data.message || 'Registration failed');
        return false;
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    }
  };

  // Login user
  const login = async (userData) => {
    setError(null);
    
    // Validate input
    if (!userData.email || !userData.password) {
      setError('Email and password are required');
      return false;
    }
    
    try {
      console.log('Attempting login with:', { email: userData.email });
      
      const res = await axios.post('/api/auth/login', userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Login response:', res.data);
      
      if (res.data.success) {
        // Store token and set auth header
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        
        // Update state
        setUser(res.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(res.data.message || 'Login failed');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack
      });
      
      // Set appropriate error message
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error: ${err.message}`);
      }
      
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        register,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};