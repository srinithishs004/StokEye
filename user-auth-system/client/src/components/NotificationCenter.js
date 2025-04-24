import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch user's notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const res = await axios.get('/api/notifications');
        setNotifications(res.data.data);
        
        // Count unread notifications
        const unread = res.data.data.filter(notification => !notification.isRead).length;
        setUnreadCount(unread);
        
        setLoading(false);
      } catch (err) {
        setError('Error fetching notifications');
        setLoading(false);
        console.error(err);
      }
    };

    fetchNotifications();
    
    // Set up interval to refresh notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification._id === id 
          ? { ...notification, isRead: true } 
          : notification
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    
    // Mark all as read when opening
    if (!showNotifications && unreadCount > 0) {
      notifications.forEach(notification => {
        if (!notification.isRead) {
          markAsRead(notification._id);
        }
      });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'info':
        return 'bi-info-circle';
      case 'success':
        return 'bi-check-circle';
      case 'warning':
        return 'bi-exclamation-triangle';
      case 'alert':
        return 'bi-exclamation-circle';
      default:
        return 'bi-bell';
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'info':
        return 'primary';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'alert':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="notification-center">
      <button 
        className="btn btn-link position-relative" 
        onClick={toggleNotifications}
        aria-label="Notifications"
      >
        <i className="bi bi-bell fs-5"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount}
            <span className="visually-hidden">unread notifications</span>
          </span>
        )}
      </button>
      
      {showNotifications && (
        <div className="notification-dropdown shadow">
          <div className="notification-header d-flex justify-content-between align-items-center p-2 bg-light">
            <h6 className="m-0">Notifications</h6>
            <button 
              className="btn btn-sm btn-close" 
              onClick={() => setShowNotifications(false)}
              aria-label="Close"
            ></button>
          </div>
          
          <div className="notification-body">
            {loading ? (
              <div className="text-center p-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-danger p-3">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-3">No notifications</div>
            ) : (
              <ul className="list-group list-group-flush">
                {notifications.map(notification => (
                  <li 
                    key={notification._id} 
                    className={`list-group-item ${!notification.isRead ? 'bg-light' : ''}`}
                    onClick={() => markAsRead(notification._id)}
                  >
                    <div className="d-flex">
                      <div className={`text-${getNotificationColor(notification.type)} me-2`}>
                        <i className={`bi ${getNotificationIcon(notification.type)}`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between">
                          <strong>{notification.title}</strong>
                          <small className="text-muted">{formatDate(notification.createdAt)}</small>
                        </div>
                        <div>{notification.message}</div>
                        {notification.stock && (
                          <small className="text-muted">
                            Related to: {notification.stock.symbol}
                          </small>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      <style jsx="true">{`
        .notification-center {
          position: relative;
        }
        
        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 320px;
          max-height: 400px;
          overflow-y: auto;
          background: white;
          border-radius: 4px;
          z-index: 1000;
        }
        
        .notification-body {
          max-height: 350px;
          overflow-y: auto;
        }
        
        .list-group-item {
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .list-group-item:hover {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter;