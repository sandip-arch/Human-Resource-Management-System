import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  Clock, 
  Gift, 
  Settings, 
  Plus, 
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
            <path d="M4 22H18L10 6H4V22Z" fill="var(--primary)" />
            <path d="M24 6H10L18 22H24V6Z" fill="var(--primary)" opacity="0.8" />
          </svg>
          <span style={{ marginLeft: '10px', verticalAlign: 'middle', letterSpacing: '0.02em' }}>Nexus HRMS</span>
        </h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        {user?.role === 'admin' && (
          <NavLink 
            to="/payroll" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <CreditCard size={20} />
            <span>Payroll Ledger</span>
          </NavLink>
        )}

        <NavLink 
          to="/employees" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>Employees</span>
        </NavLink>

        <NavLink 
          to="/attendance" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Clock size={20} />
          <span>Time Tracking</span>
        </NavLink>

        <NavLink 
          to="/leaves" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Gift size={20} />
          <span>Time Off / Leaves</span>
        </NavLink>

        <NavLink 
          to={`/profile/${user?.id}`} 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <User size={20} />
          <span>My Profile</span>
        </NavLink>

        <NavLink 
          to="/settings" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="new-request-btn" onClick={() => navigate('/leaves')}>
          <Plus size={16} />
          <span>New Request</span>
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
