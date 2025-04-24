import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    price: '',
    previousPrice: '',
    sector: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [currentStock, setCurrentStock] = useState(null);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all stocks
  const fetchStocks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/stocks');
      setStocks(res.data.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching stocks');
      setLoading(false);
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      symbol: '',
      name: '',
      price: '',
      previousPrice: '',
      sector: ''
    });
    setEditMode(false);
    setCurrentStock(null);
    setFormError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    try {
      // Validate form
      if (!formData.symbol || !formData.name || !formData.price || !formData.previousPrice) {
        setFormError('Please fill in all required fields');
        return;
      }

      if (isNaN(formData.price) || isNaN(formData.previousPrice)) {
        setFormError('Price and Previous Price must be numbers');
        return;
      }

      const stockData = {
        ...formData,
        price: parseFloat(formData.price),
        previousPrice: parseFloat(formData.previousPrice)
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
      price: stock.price,
      previousPrice: stock.previousPrice,
      sector: stock.sector || ''
    });
    setCurrentStock(stock);
    setEditMode(true);
    setFormError('');
    setSuccessMessage('');
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
                  <label htmlFor="price" className="form-label">Current Price*</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g., 150.75"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="previousPrice" className="form-label">Previous Price*</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="previousPrice"
                    name="previousPrice"
                    value={formData.previousPrice}
                    onChange={handleChange}
                    placeholder="e.g., 148.50"
                    required
                  />
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
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">Manage Stocks</h5>
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
                            <td>${stock.price.toFixed(2)}</td>
                            <td className={stock.change >= 0 ? 'text-success' : 'text-danger'}>
                              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
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
    </div>
  );
};

export default AdminDashboard;