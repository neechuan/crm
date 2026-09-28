import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Organization, Contact, Deal } from '../types.ts';
import { api } from '../api.ts';
import { Modal } from '../components/Modal.tsx';
import {
  Building2,
  ArrowLeft,
  ExternalLink,
  Edit2,
  Trash2,
  Users,
  Briefcase,
  Plus
} from 'lucide-react';

export const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orgId = Number(id);

  const [org, setOrg] = useState<(Organization & { contacts: Contact[]; deals: Deal[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadOrg = async () => {
    try {
      setIsLoading(true);
      const data = await api.getOrganization(orgId);
      setOrg(data);
      setName(data.name);
      setWebsite(data.website || '');
      setIndustry(data.industry || '');
      setNotes(data.notes || '');
    } catch (err) {
      console.error('Failed to load organization:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) loadOrg();
  }, [orgId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Organization name is required.');
      return;
    }
    try {
      await api.updateOrganization(orgId, {
        name: name.trim(),
        website: website.trim() || null,
        industry: industry.trim() || null,
        notes: notes.trim() || null,
      });
      setIsEditModalOpen(false);
      loadOrg();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update organization');
    }
  };

  const handleDelete = async () => {
    if (!org) return;
    if (window.confirm(`Are you sure you want to delete ${org.name}? This will unassign its contacts and deals.`)) {
      try {
        await api.deleteOrganization(org.id);
        navigate('/organizations');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete organization');
      }
    }
  };

  if (isLoading) {
    return <div style={{ padding: '24px' }}>Loading organization details...</div>;
  }

  if (!org) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>Organization not found</h2>
        <Link to="/organizations" className="btn btn-secondary" style={{ marginTop: '12px' }}>
          <ArrowLeft size={16} /> Back to Organizations
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/organizations" className="btn btn-secondary btn-sm" style={{ marginBottom: '12px' }}>
          <ArrowLeft size={14} /> Back to Organizations
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={24} color="var(--crm-blue)" /> {org.name}
            </h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginTop: '4px' }}>
              {org.industry || 'No industry specified'}
            </p>
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
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 className="card-title" style={{ marginBottom: '12px' }}>Organization Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
            <div>
              <span style={{ color: 'var(--gray-500)', width: '100px', display: 'inline-block' }}>Website:</span>
              {org.website ? (
                <a
                  href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--crm-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {org.website} <ExternalLink size={12} />
                </a>
              ) : (
                'None'
              )}
            </div>
            <div>
              <span style={{ color: 'var(--gray-500)', width: '100px', display: 'inline-block' }}>Industry:</span>
              <span>{org.industry || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--gray-500)', width: '100px', display: 'inline-block' }}>Contacts:</span>
              <span className="badge" style={{ backgroundColor: 'var(--gray-100)', color: 'var(--gray-800)' }}>
                {org.contacts?.length || 0}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--gray-500)', width: '100px', display: 'inline-block' }}>Deals:</span>
              <span className="badge" style={{ backgroundColor: 'var(--gray-100)', color: 'var(--gray-800)' }}>
                {org.deals?.length || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <h3 className="card-title" style={{ marginBottom: '12px' }}>Notes & Background</h3>
          <p style={{ fontSize: '14px', color: 'var(--gray-700)', whiteSpace: 'pre-wrap' }}>
            {org.notes || 'No notes added yet for this company.'}
          </p>
        </div>
      </div>

      {/* Associated Contacts */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Users size={18} color="var(--crm-blue)" /> Associated Contacts ({org.contacts?.length || 0})
          </h3>
          <Link to="/contacts" className="btn btn-secondary btn-sm">
            <Plus size={14} /> Add Contact
          </Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Job Title</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {org.contacts && org.contacts.length > 0 ? (
                org.contacts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/contacts/${c.id}`} className="table-row-link">
                        {c.name}
                      </Link>
                    </td>
                    <td>{c.job_title || '—'}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || '—'}</td>
                    <td>
                      <span className={`badge badge-${c.status}`}>{c.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--gray-500)' }}>
                    No contacts linked to this organization.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Associated Deals */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Briefcase size={18} color="var(--crm-purple)" /> Associated Deals ({org.deals?.length || 0})
          </h3>
          <Link to="/deals" className="btn btn-secondary btn-sm">
            <Plus size={14} /> Add Deal
          </Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Deal Name</th>
                <th>Primary Contact</th>
                <th>Stage</th>
                <th>Value</th>
                <th>Expected Close</th>
              </tr>
            </thead>
            <tbody>
              {org.deals && org.deals.length > 0 ? (
                org.deals.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link to={`/deals/${d.id}`} className="table-row-link">
                        {d.name}
                      </Link>
                    </td>
                    <td>{d.contact_name || '—'}</td>
                    <td>
                      <span className={`badge badge-stage-${d.stage.toLowerCase()}`}>{d.stage}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>${d.value.toLocaleString()}</td>
                    <td>{d.close_date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--gray-500)' }}>
                    No deals linked to this organization.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Organization Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Organization"
      >
        <form onSubmit={handleUpdate}>
          {formError && (
            <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="edit-org-name">Company Name *</label>
            <input
              id="edit-org-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-org-industry">Industry</label>
            <input
              id="edit-org-industry"
              type="text"
              className="form-input"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-org-website">Website</label>
            <input
              id="edit-org-website"
              type="text"
              className="form-input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-org-notes">Notes</label>
            <textarea
              id="edit-org-notes"
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
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
