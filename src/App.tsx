import React from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  Kanban,
  RotateCcw,
} from 'lucide-react';
import { api } from './api.ts';

// Pages
import { DashboardPage } from './pages/DashboardPage.tsx';
import { OrganizationsPage } from './pages/OrganizationsPage.tsx';
import { OrganizationDetailPage } from './pages/OrganizationDetailPage.tsx';
import { ContactsPage } from './pages/ContactsPage.tsx';
import { ContactDetailPage } from './pages/ContactDetailPage.tsx';
import { DealsPage } from './pages/DealsPage.tsx';
import { DealDetailPage } from './pages/DealDetailPage.tsx';
import { PipelinePage } from './pages/PipelinePage.tsx';

export const App: React.FC = () => {
  const location = useLocation();

  const handleResetData = async () => {
    if (window.confirm('Reset database to realistic sample data? All custom modifications will be replaced with sample records.')) {
      try {
        await api.resetDatabase();
        window.location.reload();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to reset database');
      }
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/organizations')) return 'Organizations';
    if (path.startsWith('/contacts')) return 'Contacts';
    if (path.startsWith('/deals')) return 'Deals';
    if (path.startsWith('/pipeline')) return 'Pipeline';
    return 'Personal CRM';
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar" aria-label="Main Navigation">
        <div className="sidebar-header">
          <div className="logo-badge">CRM</div>
          <div>
            <div className="brand-title">Personal CRM</div>
            <div className="brand-subtitle">Private Sales</div>
          </div>
        </div>

        <ul className="nav-links">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/organizations"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Building2 size={18} />
              <span>Organizations</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contacts"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>Contacts</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/deals"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Briefcase size={18} />
              <span>Deals</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pipeline"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Kanban size={18} />
              <span>Pipeline</span>
            </NavLink>
          </li>
        </ul>

        <div className="sidebar-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetData}
            title="Reset database to realistic sample data"
            style={{ width: '100%', justifyContent: 'center', backgroundColor: '#1e293b', color: '#cbd5e1', borderColor: '#334155' }}
          >
            <RotateCcw size={14} /> Reset Sample Data
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="topbar">
          <h1 className="topbar-title">{getPageTitle()}</h1>
        </header>

        <main className="content-body">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/contacts/:id" element={<ContactDetailPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/deals/:id" element={<DealDetailPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
