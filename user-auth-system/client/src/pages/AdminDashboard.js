import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatInr, formatChange } from '../utils/currencyUtils';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stocks, setStocks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stock form data
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    sector: ''
  });
  
  // Notification form state
  const [selectedStock, setSelectedStock] = useState('');
  const [targetUsers, setTargetUsers] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStock, setCurrentStock] = useState(null);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('stocks');

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Fetch all stocks and notifications
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stocks
      const stocksRes = await axios.get('/api/stocks');
      setStocks(stocksRes.data.data);
      
      // Fetch notifications
      fetchNotifications();
      
      setLoading(false);
    } catch (err) {
      setError('Error fetching data');
      setLoading(false);
      console.error(err);
    }
  };
  
  // Fetch notifications separately
  const fetchNotifications = async () => {
    try {
      const notificationsRes = await axios.get('/api/notifications/admin');
      setNotifications(notificationsRes.data.data);
    } catch (notifErr) {
      console.error('Error fetching notifications:', notifErr);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      symbol: '',
      name: '',
      sector: ''
    });
    setEditMode(false);
    setCurrentStock(null);
    setFormError('');
    setSuccessMessage('');
  };
  
  const handleRefreshAllStocks = async () => {
    try {
      setRefreshing(true);
      setError(null);
      setSuccessMessage('');
      
      const res = await axios.post('/api/stocks/refresh');
      
      setSuccessMessage('Stock refresh initiated. This may take some time due to API rate limits.');
      fetchStocks(); // Refresh the list to show any immediate updates
      
      setRefreshing(false);
    } catch (err) {
      setError('Error refreshing stocks: ' + (err.response?.data?.message || err.message));
      setRefreshing(false);
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    try {
      // Validate form
      if (!formData.symbol) {
        setFormError('Stock symbol is required');
        return;
      }

      const stockData = {
        ...formData
      };

      let res;
      if (editMode) {
        // Update stock
        res = await axios.put(`/api/stocks/${currentStock.symbol}`, stockData);
        setSuccessMessage(`Stock ${currentStock.symbol} updated successfully`);
      } else {
        // Create new stock
        res = await axios.post('/api/stocks', stockData);
        setSuccessMessage(`Stock ${stockData.symbol} created successfully`);
      }

      // Refresh stocks list
      fetchStocks();
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error processing your request');
      console.error(err);
    }
  };

  const handleEdit = (stock) => {
    setFormData({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector || ''
    });
    setCurrentStock(stock);
    setEditMode(true);
    setFormError('');
    setSuccessMessage('');
  };
  
  const handleUpdateFromAPI = async (symbol) => {
    try {
      setLoading(true);
      const res = await axios.put(`/api/stocks/${symbol}`, { useApi: true });
      setSuccessMessage(`Stock ${symbol} updated successfully from API`);
      fetchStocks();
      setLoading(false);
    } catch (err) {
      setError('Error updating stock from API: ' + (err.response?.data?.message || err.message));
      setLoading(false);
      console.error(err);
    }
  };

  const handleDelete = async (symbol) => {
    if (window.confirm(`Are you sure you want to delete ${symbol}?`)) {
      try {
        await axios.delete(`/api/stocks/${symbol}`);
        setSuccessMessage(`Stock ${symbol} deleted successfully`);
        fetchStocks();
      } catch (err) {
        setError(err.response?.data?.message || 'Error deleting stock');
        console.error(err);
      }
    }
  };
  
  // Handle notification creation
  const handleCreateNotification = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    
    try {
      if (!title || !message) {
        setFormError('Title and message are required');
        return;
      }
      
      // Validate that a stock is selected when targeting favorites
      if (targetUsers === 'favorites' && !selectedStock) {
        setFormError('Please select a stock when targeting users with favorites');
        return;
      }
      
      const notificationData = {
        title,
        message,
        type: notificationType,
        targetUsers,
        stockId: selectedStock === '' ? null : selectedStock
      };
      
      console.log('Sending notification:', notificationData);
      
      const response = await axios.post('/api/notifications', notificationData);
      console.log('Notification response:', response.data);
      
      // Reset form
      setTitle('');
      setMessage('');
      setNotificationType('info');
      setTargetUsers('all');
      setSelectedStock('');
      
      // Refresh notifications
      fetchNotifications();
      
      setSuccessMessage('Notification sent successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error creating notification:', err);
      setFormError(err.response?.data?.message || 'Error creating notification');
    }
  };

  if (user.role !== 'admin') {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'stocks' ? 'active' : ''}`} 
            onClick={() => setActiveTab('stocks')}
          >
            Manage Stocks
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`} 
            onClick={() => setActiveTab('notifications')}
          >
            Send Notifications
          </button>
        </li>
      </ul>
      
      {activeTab === 'stocks' && (
        <div className="row">
          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">{editMode ? 'Edit Stock' : 'Add New Stock'}</h5>
              </div>
              <div className="card-body">
                {formError && (
                  <div className="alert alert-danger" role="alert">
                    {formError}
                  </div>
                )}
                {successMessage && (
                  <div className="alert alert-success" role="alert">
                    {successMessage}
                  </div>
                )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="symbol" className="form-label">Symbol*</label>
                  <input
                    type="text"
                    className="form-control"
                    id="symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleChange}
                    disabled={editMode}
                    placeholder="e.g., AAPL"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Name*</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Apple Inc."
                    required
                  />
                </div>
                <div className="mb-3">
                  <p className="text-info">
                    <i className="bi bi-info-circle me-2"></i>
                    {editMode ? 
                      'Price data will be updated from Alpha Vantage API when you save.' :
                      'Price data will be fetched from Alpha Vantage API when you add the stock.'}
                  </p>
                </div>
                <div className="mb-3">
                  <label htmlFor="sector" className="form-label">Sector</label>
                  <input
                    type="text"
                    className="form-control"
                    id="sector"
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    placeholder="e.g., Technology"
                  />
                </div>
                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editMode ? 'Update Stock' : 'Add Stock'}
                  </button>
                  {editMode && (
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Manage Stocks</h5>
              <button 
                className="btn btn-sm btn-outline-light" 
                onClick={handleRefreshAllStocks}
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh All from API
                  </>
                )}
              </button>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Change</th>
                        <th>Change %</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocks.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center">No stocks found</td>
                        </tr>
                      ) : (
                        stocks.map((stock) => (
                          <tr key={stock.symbol}>
                            <td>{stock.symbol}</td>
                            <td>{stock.name}</td>
                            <td>{formatInr(stock.price)}</td>
                            <td className={stock.change >= 0 ? 'text-success' : 'text-danger'}>
                              {formatChange(stock.change)}
                            </td>
                            <td className={stock.changePercent >= 0 ? 'text-success' : 'text-danger'}>
                              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => handleEdit(stock)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(stock.symbol)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
      
      {activeTab === 'notifications' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Send Notification</h5>
              </div>
              <div className="card-body">
                {formError && (
                  <div className="alert alert-danger" role="alert">
                    {formError}
                  </div>
                )}
                {successMessage && (
                  <div className="alert alert-success" role="alert">
                    {successMessage}
                  </div>
                )}
                <form onSubmit={handleCreateNotification}>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title*</label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Notification title"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="message" className="form-label">Message*</label>
                    <textarea
                      className="form-control"
                      id="message"
                      rows="3"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Notification message"
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="notificationType" className="form-label">Type</label>
                    <select
                      className="form-select"
                      id="notificationType"
                      value={notificationType}
                      onChange={(e) => setNotificationType(e.target.value)}
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="alert">Alert</option>
                      <option value="success">Success</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="targetUsers" className="form-label">Target Users</label>
                    <select
                      className="form-select"
                      id="targetUsers"
                      value={targetUsers}
                      onChange={(e) => setTargetUsers(e.target.value)}
                    >
                      <option value="all">All Users</option>
                      <option value="favorites">Users with Favorite Stock</option>
                    </select>
                  </div>
                  
                  {targetUsers === 'favorites' && (
                    <div className="mb-3">
                      <label htmlFor="selectedStock" className="form-label">Select Stock*</label>
                      <select
                        className="form-select"
                        id="selectedStock"
                        value={selectedStock}
                        onChange={(e) => setSelectedStock(e.target.value)}
                        required={targetUsers === 'favorites'}
                      >
                        <option value="">Select a stock...</option>
                        {stocks.map((stock) => (
                          <option key={stock.symbol} value={stock._id || stock.symbol}>
                            {stock.symbol} - {stock.name}
                          </option>
                        ))}
                      </select>
                      <div className="form-text">
                        Only users who have added this stock to their favorites will receive the notification.
                      </div>
                    </div>
                  )}
                  
                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-primary">
                      Send Notification
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-dark text-white">
                <h5 className="mb-0">Recent Notifications</h5>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="list-group">
                    {notifications.length === 0 ? (
                      <p className="text-center">No notifications sent yet</p>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification._id} className="list-group-item list-group-item-action">
                          <div className="d-flex w-100 justify-content-between">
                            <h5 className="mb-1">{notification.title}</h5>
                            <small className="text-muted">
                              {new Date(notification.createdAt).toLocaleString()}
                            </small>
                          </div>
                          <p className="mb-1">{notification.message}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              Type: <span className={`badge bg-${getBadgeColor(notification.type)}`}>
                                {notification.type}
                              </span>
                            </small>
                            <small className="text-muted">
                              Target: {notification.targetUsers === 'all' ? 'All Users' : 
                                notification.targetUsers === 'favorites' ? 'Users with Favorite Stock' : 
                                notification.targetUsers}
                              {notification.stock && ` (${notification.stock.symbol})`}
                            </small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get badge color based on notification type
const getBadgeColor = (type) => {
  switch (type) {
    case 'info': return 'info';
    case 'warning': return 'warning';
    case 'alert': return 'danger';
    case 'success': return 'success';
    default: return 'secondary';
  }
};

export default AdminDashboard;