import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Deal, Organization, Contact, DealStage } from '../types.ts';
import { api } from '../api.ts';
import { Modal } from '../components/Modal.tsx';
import { Briefcase, Plus, Search, Edit2, Trash2, Building2, Users } from 'lucide-react';

const STAGES: DealStage[] = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export const DealsPage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [contactId, setContactId] = useState('');
  const [stage, setStage] = useState<DealStage>('New');
  const [value, setValue] = useState('10000');
  const [probability, setProbability] = useState('50');
  const [closeDate, setCloseDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadDeals = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDeals(search, stageFilter);
      setDeals(data);
    } catch (err) {
      console.error('Failed to load deals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [orgsData, contactsData] = await Promise.all([
        api.getOrganizations(),
        api.getContacts(),
      ]);
      setOrganizations(orgsData);
      setContacts(contactsData);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    loadDeals();
  }, [search, stageFilter]);

  const openCreateModal = () => {
    setEditingDeal(null);
    setName('');
    setOrgId('');
    setContactId('');
    setStage('New');
    setValue('10000');
    setProbability('20');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setCloseDate(defaultDate.toISOString().substring(0, 10));
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (d: Deal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDeal(d);
    setName(d.name);
    setOrgId(d.organization_id ? String(d.organization_id) : '');
    setContactId(d.contact_id ? String(d.contact_id) : '');
    setStage(d.stage);
    setValue(String(d.value));
    setProbability(String(d.probability));
    setCloseDate(d.close_date);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, dealName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete deal "${dealName}"?`)) {
      try {
        await api.deleteDeal(id);
        loadDeals();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete deal');
      }
    }
  };

  const handleStageChange = (newStage: DealStage) => {
    setStage(newStage);
    // Automatic probability adjustment
    if (newStage === 'Won') setProbability('100');
    else if (newStage === 'Lost') setProbability('0');
    else if (newStage === 'New') setProbability('20');
    else if (newStage === 'Qualified') setProbability('40');
    else if (newStage === 'Proposal') setProbability('60');
    else if (newStage === 'Negotiation') setProbability('80');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Deal name is required.');
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setFormError('Please enter a valid deal value.');
      return;
    }
    const numProb = parseInt(probability, 10);
    if (isNaN(numProb) || numProb < 0 || numProb > 100) {
      setFormError('Probability must be between 0 and 100.');
      return;
    }
    if (!closeDate) {
      setFormError('Close date is required.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        organization_id: orgId ? Number(orgId) : null,
        contact_id: contactId ? Number(contactId) : null,
        stage,
        value: numValue,
        probability: numProb,
        close_date: closeDate,
      };

      if (editingDeal) {
        await api.updateDeal(editingDeal.id, payload);
      } else {
        await api.createDeal(payload);
      }
      setIsModalOpen(false);
      loadDeals();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save deal');
    }
  };

  return (
    <div>
      <div className="filter-toolbar">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box">
            <Search size={16} color="var(--gray-400)" />
            <input
              id="deal-search-input"
              type="text"
              placeholder="Search deals by name, company, or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="deal-stage-filter" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-600)' }}>
              Stage:
            </label>
            <select
              id="deal-stage-filter"
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="all">All Stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          id="btn-add-deal"
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          <Plus size={16} /> Add Deal
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Deal Name</th>
              <th>Stage</th>
              <th>Value</th>
              <th>Probability</th>
              <th>Expected Revenue</th>
              <th>Close Date</th>
              <th>Organization</th>
              <th>Primary Contact</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '24px' }}>
                  Loading deals...
                </td>
              </tr>
            ) : deals.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-500)' }}>
                  No deals found. Click "Add Deal" to track a potential sale.
                </td>
              </tr>
            ) : (
              deals.map((d) => {
                const expected = Math.round(d.value * (d.probability / 100));

                return (
                  <tr key={d.id}>
                    <td>
                      <Link to={`/deals/${d.id}`} className="table-row-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Briefcase size={16} color="var(--crm-blue)" />
                        {d.name}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge badge-stage-${d.stage.toLowerCase()}`}>
                        {d.stage}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                      ${d.value.toLocaleString()}
                    </td>
                    <td>{d.probability}%</td>
                    <td style={{ color: 'var(--crm-blue-dark)', fontWeight: 600 }}>
                      ${expected.toLocaleString()}
                    </td>
                    <td>{d.close_date}</td>
                    <td>
                      {d.organization_id && d.organization_name ? (
                        <Link
                          to={`/organizations/${d.organization_id}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--crm-blue)', textDecoration: 'none' }}
                        >
                          <Building2 size={13} /> {d.organization_name}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {d.contact_id && d.contact_name ? (
                        <Link
                          to={`/contacts/${d.contact_id}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'inherit', textDecoration: 'none' }}
                        >
                          <Users size={13} color="var(--gray-500)" /> {d.contact_name}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-icon"
                        title="Edit Deal"
                        onClick={(e) => openEditModal(d, e)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon delete"
                        title="Delete Deal"
                        onClick={(e) => handleDelete(d.id, d.name, e)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDeal ? 'Edit Deal' : 'Add New Deal'}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="deal-name">Deal Name *</label>
            <input
              id="deal-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Enterprise Cloud Deployment"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="deal-value">Value (USD) *</label>
              <input
                id="deal-value"
                type="number"
                min="0"
                step="100"
                className="form-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="deal-probability">Probability (%) *</label>
              <input
                id="deal-probability"
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="deal-stage">Pipeline Stage *</label>
              <select
                id="deal-stage"
                className="form-select"
                value={stage}
                onChange={(e) => handleStageChange(e.target.value as DealStage)}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="deal-close-date">Expected Close Date *</label>
              <input
                id="deal-close-date"
                type="date"
                className="form-input"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="deal-org">Organization</label>
            <select
              id="deal-org"
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
            <label className="form-label" htmlFor="deal-contact">Primary Contact</label>
            <select
              id="deal-contact"
              className="form-select"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              <option value="">No Primary Contact</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.organization_name ? `(${c.organization_name})` : ''}
                </option>
              ))}
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
              {editingDeal ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
