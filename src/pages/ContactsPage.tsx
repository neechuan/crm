import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Contact, Organization, ContactStatus } from '../types.ts';
import { api } from '../api.ts';
import { Modal } from '../components/Modal.tsx';
import { Users, Plus, Search, Edit2, Trash2, Mail, Phone, Building2 } from 'lucide-react';

export const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [orgId, setOrgId] = useState<string>('');
  const [status, setStatus] = useState<ContactStatus>('lead');
  const [formError, setFormError] = useState<string | null>(null);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const data = await api.getContacts(search, statusFilter);
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const data = await api.getOrganizations();
      setOrganizations(data);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    loadContacts();
  }, [search, statusFilter]);

  const openCreateModal = () => {
    setEditingContact(null);
    setName('');
    setEmail('');
    setPhone('');
    setJobTitle('');
    setOrgId('');
    setStatus('lead');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContact(c);
    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone || '');
    setJobTitle(c.job_title || '');
    setOrgId(c.organization_id ? String(c.organization_id) : '');
    setStatus(c.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, contactName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${contactName}?`)) {
      try {
        await api.deleteContact(id);
        loadContacts();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete contact');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError('Name and email are required.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        job_title: jobTitle.trim() || null,
        organization_id: orgId ? Number(orgId) : null,
        status,
      };

      if (editingContact) {
        await api.updateContact(editingContact.id, payload);
      } else {
        await api.createContact(payload);
      }
      setIsModalOpen(false);
      loadContacts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save contact');
    }
  };

  return (
    <div>
      <div className="filter-toolbar">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box">
            <Search size={16} color="var(--gray-400)" />
            <input
              id="contact-search-input"
              type="text"
              placeholder="Search by name, email, title, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="contact-status-filter" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-600)' }}>
              Status:
            </label>
            <select
              id="contact-status-filter"
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="lead">Lead</option>
              <option value="qualified">Qualified</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>

        <button
          id="btn-add-contact"
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          <Plus size={16} /> Add Contact
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Contact Name</th>
              <th>Status</th>
              <th>Organization</th>
              <th>Job Title</th>
              <th>Email</th>
              <th>Phone</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                  Loading contacts...
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-500)' }}>
                  No contacts found matching your criteria.
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/contacts/${c.id}`} className="table-row-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} color="var(--crm-purple)" />
                      {c.name}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge badge-${c.status}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.organization_id && c.organization_name ? (
                      <Link
                        to={`/organizations/${c.organization_id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--crm-blue)', textDecoration: 'none' }}
                      >
                        <Building2 size={13} /> {c.organization_name}
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--gray-400)' }}>—</span>
                    )}
                  </td>
                  <td>{c.job_title || '—'}</td>
                  <td>
                    <a
                      href={`mailto:${c.email}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'inherit', textDecoration: 'none' }}
                    >
                      <Mail size={13} color="var(--gray-400)" /> {c.email}
                    </a>
                  </td>
                  <td>
                    {c.phone ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={13} color="var(--gray-400)" /> {c.phone}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-icon"
                      title="Edit Contact"
                      onClick={(e) => openEditModal(c, e)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon delete"
                      title="Delete Contact"
                      onClick={(e) => handleDelete(c.id, c.name, e)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingContact ? 'Edit Contact' : 'Add New Contact'}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="contact-name">Full Name *</label>
            <input
              id="contact-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contact-email">Email Address *</label>
            <input
              id="contact-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contact-phone">Phone Number</label>
            <input
              id="contact-phone"
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contact-job-title">Job Title</label>
            <input
              id="contact-job-title"
              type="text"
              className="form-input"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. VP of Sales"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contact-org">Organization</label>
            <select
              id="contact-org"
              className="form-select"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
            >
              <option value="">No Organization (Independent)</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contact-status">Status</label>
            <select
              id="contact-status"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as ContactStatus)}
            >
              <option value="lead">Lead</option>
              <option value="qualified">Qualified</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '-20px -20px -20px -20px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingContact ? 'Save Changes' : 'Create Contact'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
