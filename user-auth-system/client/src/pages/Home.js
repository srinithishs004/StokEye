import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="container mt-5">
      <div className="jumbotron text-center">
        <h1 className="display-4">
          <i className="bi bi-graph-up-arrow me-3 text-primary"></i>
          Welcome to StockEye
        </h1>
        <p className="lead">
          Your personal stock monitoring system with real-time market data and portfolio tracking.
        </p>
        <hr className="my-4" />
        
        <div className="row mt-5">
          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-body text-center">
                <i className="bi bi-graph-up text-primary" style={{ fontSize: '3rem' }}></i>
                <h3 className="mt-3">Real-time Stock Data</h3>
                <p>Monitor stock prices and market trends in real-time with our advanced tracking system.</p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-body text-center">
                <i className="bi bi-star text-warning" style={{ fontSize: '3rem' }}></i>
                <h3 className="mt-3">Personalized Watchlists</h3>
                <p>Create custom watchlists to track your favorite stocks and investment opportunities.</p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-body text-center">
                <i className="bi bi-briefcase text-success" style={{ fontSize: '3rem' }}></i>
                <h3 className="mt-3">Portfolio Management</h3>
                <p>Track your investments and analyze performance with our portfolio management tools.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-5">
          {isAuthenticated ? (
            <div>
              <p className="lead">You are logged in as <strong>{user.name}</strong>!</p>
              <Link 
                to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} 
                className="btn btn-primary btn-lg"
              >
                <i className="bi bi-speedometer2 me-2"></i>
                Go to {user.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
              </Link>
            </div>
          ) : (
            <div>
              <p className="lead">Please login or register to access the StockEye dashboard.</p>
              <Link to="/login" className="btn btn-primary btn-lg me-3">
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Login
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg">
                <i className="bi bi-person-plus me-2"></i>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;