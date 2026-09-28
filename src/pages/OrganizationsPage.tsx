import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Organization } from '../types.ts';
import { api } from '../api.ts';
import { Modal } from '../components/Modal.tsx';
import { Building2, Plus, Search, Edit2, Trash2, ExternalLink } from 'lucide-react';

export const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      const data = await api.getOrganizations(search);
      setOrganizations(data);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [search]);

  const openCreateModal = () => {
    setEditingOrg(null);
    setName('');
    setWebsite('');
    setIndustry('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (org: Organization, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOrg(org);
    setName(org.name);
    setWebsite(org.website || '');
    setIndustry(org.industry || '');
    setNotes(org.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete organization "${name}"?`)) {
      try {
        await api.deleteOrganization(id);
        loadOrganizations();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete organization');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Organization name is required.');
      return;
    }

    try {
      if (editingOrg) {
        await api.updateOrganization(editingOrg.id, {
          name: name.trim(),
          website: website.trim() || null,
          industry: industry.trim() || null,
          notes: notes.trim() || null,
        });
      } else {
        await api.createOrganization({
          name: name.trim(),
          website: website.trim() || null,
          industry: industry.trim() || null,
          notes: notes.trim() || null,
        });
      }
      setIsModalOpen(false);
      loadOrganizations();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error saving organization');
    }
  };

  return (
    <div>
      <div className="filter-toolbar">
        <div className="search-box">
          <Search size={16} color="var(--gray-400)" />
          <input
            id="org-search-input"
            type="text"
            placeholder="Search organizations by name, industry, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          id="btn-add-organization"
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          <Plus size={16} /> Add Organization
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Industry</th>
              <th>Website</th>
              <th>Contacts</th>
              <th>Deals</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                  Loading organizations...
                </td>
              </tr>
            ) : organizations.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-500)' }}>
                  No organizations found. Click "Add Organization" to create one.
                </td>
              </tr>
            ) : (
              organizations.map((org) => (
                <tr key={org.id} style={{ cursor: 'pointer' }}>
                  <td>
                    <Link to={`/organizations/${org.id}`} className="table-row-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color="var(--crm-blue)" />
                      {org.name}
                    </Link>
                  </td>
                  <td>{org.industry || '—'}</td>
                  <td>
                    {org.website ? (
                      <a
                        href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--crm-blue)' }}
                      >
                        {org.website.replace(/^https?:\/\//, '')} <ExternalLink size={12} />
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: 'var(--gray-100)', color: 'var(--gray-700)' }}>
                      {org.contacts_count || 0}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: 'var(--gray-100)', color: 'var(--gray-700)' }}>
                      {org.deals_count || 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-icon"
                      title="Edit Organization"
                      onClick={(e) => openEditModal(org, e)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon delete"
                      title="Delete Organization"
                      onClick={(e) => handleDelete(org.id, org.name, e)}
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
        title={editingOrg ? 'Edit Organization' : 'Add New Organization'}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="org-name">Company Name *</label>
            <input
              id="org-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="org-industry">Industry</label>
            <input
              id="org-industry"
              type="text"
              className="form-input"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Cloud Infrastructure"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="org-website">Website</label>
            <input
              id="org-website"
              type="text"
              className="form-input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="org-notes">Notes</label>
            <textarea
              id="org-notes"
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key facts, procurement details, background..."
              rows={3}
            />
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
              {editingOrg ? 'Save Changes' : 'Create Organization'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
