import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, HelpCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import './Header.css';

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCounts, setPendingCounts] = useState({ registrations: 0, leaves: 0, total: 0 });

  useEffect(() => {
    if (user && user.role === 'admin') {
      const fetchCounts = async () => {
        try {
          const { data } = await notificationAPI.getPendingCount();
          setPendingCounts(data.data);
        } catch (error) {
          console.error('Failed to fetch notifications counts:', error.message);
        }
      };

      fetchCounts();
      // Poll notifications count every 15 seconds
      const interval = setInterval(fetchCounts, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleNotificationClick = () => {
    if (user?.role !== 'admin') return;
    if (pendingCounts.registrations > 0) {
      navigate('/employees');
    } else if (pendingCounts.leaves > 0) {
      navigate('/leaves');
    } else {
      navigate('/employees'); // Default redirect
    }
  };

  return (
    <header className="header">
      <div className="header-search-container">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search payroll records, employees, or reports..." 
          className="header-search-input"
        />
      </div>

      <div className="header-actions">
        <button className="header-icon-btn" onClick={handleNotificationClick}>
          <Bell size={20} />
          {pendingCounts.total > 0 && (
            <span className="notification-indicator-badge">
              {pendingCounts.total}
            </span>
          )}
        </button>
        <button className="header-icon-btn">
          <HelpCircle size={20} />
        </button>

        <div className="header-profile-divider"></div>

        <div 
          className="header-profile"
          onClick={() => user && navigate(`/profile/${user.id}`)}
        >
          <div className="header-profile-info">
            <span className="profile-name">{user?.name || 'Guest'}</span>
            <span className="profile-role">
              {user?.role === 'admin' ? 'Admin Officer' : 'Employee'}
            </span>
          </div>
          <div className="header-profile-avatar">
            {user?.name ? (
              <span className="avatar-initials">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            ) : (
              <User size={18} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
