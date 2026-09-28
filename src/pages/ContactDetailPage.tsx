import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Contact, Activity, Deal, Organization, ContactStatus } from '../types.ts';
import { api } from '../api.ts';
import { Modal } from '../components/Modal.tsx';
import { ActivityLogger } from '../components/ActivityLogger.tsx';
import { ActivityTimeline } from '../components/ActivityTimeline.tsx';
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';

export const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contactId = Number(id);

  const [contact, setContact] = useState<(Contact & { activities: Activity[]; deals: Deal[] }) | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [orgId, setOrgId] = useState('');
  const [status, setStatus] = useState<ContactStatus>('lead');
  const [formError, setFormError] = useState<string | null>(null);

  const loadContact = async () => {
    try {
      setIsLoading(true);
      const data = await api.getContact(contactId);
      setContact(data);
      setName(data.name);
      setEmail(data.email);
      setPhone(data.phone || '');
      setJobTitle(data.job_title || '');
      setOrgId(data.organization_id ? String(data.organization_id) : '');
      setStatus(data.status);
    } catch (err) {
      console.error('Failed to load contact:', err);
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
    if (contactId) {
      loadContact();
      loadOrganizations();
    }
  }, [contactId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError('Name and email are required.');
      return;
    }

    try {
      await api.updateContact(contactId, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        job_title: jobTitle.trim() || null,
        organization_id: orgId ? Number(orgId) : null,
        status,
      });
      setIsEditModalOpen(false);
      loadContact();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update contact');
    }
  };

  const handleDelete = async () => {
    if (!contact) return;
    if (window.confirm(`Are you sure you want to delete ${contact.name}?`)) {
      try {
        await api.deleteContact(contact.id);
        navigate('/contacts');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete contact');
      }
    }
  };

  if (isLoading) {
    return <div style={{ padding: '24px' }}>Loading contact details...</div>;
  }

  if (!contact) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>Contact not found</h2>
        <Link to="/contacts" className="btn btn-secondary" style={{ marginTop: '12px' }}>
          <ArrowLeft size={16} /> Back to Contacts
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/contacts" className="btn btn-secondary btn-sm" style={{ marginBottom: '12px' }}>
          <ArrowLeft size={14} /> Back to Contacts
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={24} color="var(--crm-purple)" /> {contact.name}
            </h1>
            <span className={`badge badge-${contact.status}`} style={{ fontSize: '13px', padding: '4px 10px' }}>
              {contact.status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit2 size={15} /> Edit
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Contact Info Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 className="card-title" style={{ marginBottom: '14px' }}>Contact Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div>
              <span style={{ color: 'var(--gray-500)', width: '100px', display: 'inline-block' }}>Job Title:</span>
              <span style={{ fontWeight: 600 }}>{contact.job_title || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--gray-500)', width: '100px', display: 'inline-block' }}>Company:</span>
              {contact.organization_id && contact.organization_name ? (
                <Link
                  to={`/organizations/${contact.organization_id}`}
                  style={{ color: 'var(--crm-blue)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Building2 size={14} /> {contact.organization_name}
                </Link>
              ) : (
                <span style={{ color: 'var(--gray-400)' }}>None (Independent)</span>
              )}
            </div>
            <div>
              <span style={{ color: 'var(--gray-500)', width: '100px', display: 'inline-block' }}>Email:</span>
              <a href={`mailto:${contact.email}`} style={{ color: 'var(--crm-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={14} /> {contact.email}
              </a>
            </div>
            <div>
              <span style={{ color: 'var(--gray-500)', width: '100px', display: 'inline-block' }}>Phone:</span>
              <span>
                {contact.phone ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={14} /> {contact.phone}
                  </span>
                ) : (
                  '—'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Associated Deals */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header" style={{ marginBottom: '12px' }}>
            <h3 className="card-title">
              <Briefcase size={16} color="var(--crm-blue)" /> Associated Deals ({contact.deals?.length || 0})
            </h3>
            <Link to="/deals" className="btn btn-secondary btn-sm">
              <Plus size={12} /> Add Deal
            </Link>
          </div>
          {contact.deals && contact.deals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {contact.deals.map((deal) => (
                <div
                  key={deal.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--gray-50)',
                  }}
                >
                  <div>
                    <Link to={`/deals/${deal.id}`} style={{ fontWeight: 600, color: 'var(--crm-blue)', fontSize: '13px' }}>
                      {deal.name}
                    </Link>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                      ${deal.value.toLocaleString()} • Expected: {deal.close_date}
                    </div>
                  </div>
                  <span className={`badge badge-stage-${deal.stage.toLowerCase()}`}>
                    {deal.stage}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
              No deals currently associated with this contact.
            </div>
          )}
        </div>
      </div>

      {/* Activity Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <div>
          <ActivityLogger
            contactId={contact.id}
            onActivityAdded={loadContact}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Activity Timeline ({contact.activities?.length || 0})</h3>
          </div>
          <ActivityTimeline
            activities={contact.activities || []}
            onActivityChanged={loadContact}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Contact"
      >
        <form onSubmit={handleUpdate}>
          {formError && (
            <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="edit-contact-name">Full Name *</label>
            <input
              id="edit-contact-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-contact-email">Email Address *</label>
            <input
              id="edit-contact-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-contact-phone">Phone Number</label>
            <input
              id="edit-contact-phone"
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-contact-job">Job Title</label>
            <input
              id="edit-contact-job"
              type="text"
              className="form-input"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-contact-org">Organization</label>
            <select
              id="edit-contact-org"
              className="form-select"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
            >
              <option value="">No Organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-contact-status">Status</label>
            <select
              id="edit-contact-status"
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
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
