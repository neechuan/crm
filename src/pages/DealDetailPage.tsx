import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Deal, Activity, Organization, Contact, DealStage } from '../types.ts';
import { api } from '../api.ts';
import { Modal } from '../components/Modal.tsx';
import { ActivityLogger } from '../components/ActivityLogger.tsx';
import { ActivityTimeline } from '../components/ActivityTimeline.tsx';
import {
  Briefcase,
  ArrowLeft,
  Building2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit2,
  Trash2
} from 'lucide-react';

const STAGES: DealStage[] = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export const DealDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dealId = Number(id);

  const [deal, setDeal] = useState<(Deal & { activities: Activity[] }) | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [contactId, setContactId] = useState('');
  const [stage, setStage] = useState<DealStage>('New');
  const [value, setValue] = useState('');
  const [probability, setProbability] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadDeal = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDeal(dealId);
      setDeal(data);
      setName(data.name);
      setOrgId(data.organization_id ? String(data.organization_id) : '');
      setContactId(data.contact_id ? String(data.contact_id) : '');
      setStage(data.stage);
      setValue(String(data.value));
      setProbability(String(data.probability));
      setCloseDate(data.close_date);
    } catch (err) {
      console.error('Failed to load deal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [orgs, cList] = await Promise.all([
        api.getOrganizations(),
        api.getContacts(),
      ]);
      setOrganizations(orgs);
      setContacts(cList);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  };

  useEffect(() => {
    if (dealId) {
      loadDeal();
      loadDependencies();
    }
  }, [dealId]);

  const handleStageChange = async (newStage: DealStage) => {
    try {
      const updated = await api.updateDealStage(dealId, newStage);
      setDeal((prev) => (prev ? { ...prev, ...updated } : null));
      setStage(newStage);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update deal stage');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Deal name is required.');
      return;
    }
    const numVal = parseFloat(value);
    const numProb = parseInt(probability, 10);
    if (isNaN(numVal) || numVal < 0) {
      setFormError('Valid value is required.');
      return;
    }

    try {
      await api.updateDeal(dealId, {
        name: name.trim(),
        organization_id: orgId ? Number(orgId) : null,
        contact_id: contactId ? Number(contactId) : null,
        stage,
        value: numVal,
        probability: numProb,
        close_date: closeDate,
      });
      setIsEditModalOpen(false);
      loadDeal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update deal');
    }
  };

  const handleDelete = async () => {
    if (!deal) return;
    if (window.confirm(`Are you sure you want to delete ${deal.name}?`)) {
      try {
        await api.deleteDeal(deal.id);
        navigate('/deals');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete deal');
      }
    }
  };

  if (isLoading) {
    return <div style={{ padding: '24px' }}>Loading deal details...</div>;
  }

  if (!deal) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>Deal not found</h2>
        <Link to="/deals" className="btn btn-secondary" style={{ marginTop: '12px' }}>
          <ArrowLeft size={16} /> Back to Deals
        </Link>
      </div>
    );
  }

  const expectedRevenue = Math.round(deal.value * (deal.probability / 100));

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/deals" className="btn btn-secondary btn-sm" style={{ marginBottom: '12px' }}>
          <ArrowLeft size={14} /> Back to Deals
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Briefcase size={24} color="var(--crm-blue)" /> {deal.name}
              </h1>
              <span className={`badge badge-stage-${deal.stage.toLowerCase()}`} style={{ fontSize: '13px', padding: '4px 10px' }}>
                {deal.stage}
              </span>
            </div>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginTop: '4px' }}>
              {deal.organization_name ? `With ${deal.organization_name}` : 'Independent deal'}
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

      {/* Stage Progression Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: '8px' }}>
          Update Pipeline Stage:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STAGES.map((s) => (
            <button
              key={s}
              type="button"
              className={`btn btn-sm ${deal.stage === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleStageChange(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics & Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--crm-blue-light)', color: 'var(--crm-blue-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                Deal Value
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gray-900)' }}>
                ${deal.value.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--crm-amber-light)', color: 'var(--crm-amber-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                Expected Revenue ({deal.probability}%)
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--crm-blue-dark)' }}>
                ${expectedRevenue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--gray-100)', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                Expected Close Date
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-900)' }}>
                {deal.close_date}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
            Relationships
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--gray-500)', width: '70px', display: 'inline-block' }}>Company:</span>
              {deal.organization_id && deal.organization_name ? (
                <Link to={`/organizations/${deal.organization_id}`} style={{ color: 'var(--crm-blue)', fontWeight: 600, textDecoration: 'none' }}>
                  <Building2 size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {deal.organization_name}
                </Link>
              ) : (
                'None'
              )}
            </div>
            <div>
              <span style={{ color: 'var(--gray-500)', width: '70px', display: 'inline-block' }}>Contact:</span>
              {deal.contact_id && deal.contact_name ? (
                <Link to={`/contacts/${deal.contact_id}`} style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}>
                  <Users size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {deal.contact_name}
                </Link>
              ) : (
                'None'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <div>
          <ActivityLogger
            dealId={deal.id}
            contactId={deal.contact_id || undefined}
            onActivityAdded={loadDeal}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Deal Activity & Notes ({deal.activities?.length || 0})</h3>
          </div>
          <ActivityTimeline
            activities={deal.activities || []}
            onActivityChanged={loadDeal}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Deal"
      >
        <form onSubmit={handleUpdate}>
          {formError && (
            <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="edit-deal-name">Deal Name *</label>
            <input
              id="edit-deal-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-deal-value">Value (USD) *</label>
              <input
                id="edit-deal-value"
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
              <label className="form-label" htmlFor="edit-deal-prob">Probability (%) *</label>
              <input
                id="edit-deal-prob"
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
              <label className="form-label" htmlFor="edit-deal-stage">Pipeline Stage *</label>
              <select
                id="edit-deal-stage"
                className="form-select"
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-deal-close">Expected Close Date *</label>
              <input
                id="edit-deal-close"
                type="date"
                className="form-input"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-deal-org">Organization</label>
            <select
              id="edit-deal-org"
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
            <label className="form-label" htmlFor="edit-deal-contact">Primary Contact</label>
            <select
              id="edit-deal-contact"
              className="form-select"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              <option value="">No Primary Contact</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
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
