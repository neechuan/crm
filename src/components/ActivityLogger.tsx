import React, { useState } from 'react';
import type { ActivityType } from '../types.ts';
import { api } from '../api.ts';
import { FileText, Phone, Mail, Calendar, Plus } from 'lucide-react';

interface ActivityLoggerProps {
  contactId?: number | null;
  dealId?: number | null;
  onActivityAdded: () => void;
}

export const ActivityLogger: React.FC<ActivityLoggerProps> = ({
  contactId,
  dealId,
  onActivityAdded,
}) => {
  const [type, setType] = useState<ActivityType>('note');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please enter a description or notes.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await api.createActivity({
        type,
        contact_id: contactId || null,
        deal_id: dealId || null,
        description: description.trim(),
        due_date: dueDate.trim() ? dueDate : null,
      });
      setDescription('');
      setDueDate('');
      onActivityAdded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="card-header" style={{ marginBottom: '12px' }}>
        <h3 className="card-title">
          <Plus size={16} /> Log an Activity or Task
        </h3>
      </div>
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '10px' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            type="button"
            className={`btn btn-sm ${type === 'note' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setType('note')}
          >
            <FileText size={14} /> Note
          </button>
          <button
            type="button"
            className={`btn btn-sm ${type === 'call' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setType('call')}
          >
            <Phone size={14} /> Call
          </button>
          <button
            type="button"
            className={`btn btn-sm ${type === 'email' ? 'btn-purple' : 'btn-secondary'}`}
            onClick={() => setType('email')}
          >
            <Mail size={14} /> Email
          </button>
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <textarea
            className="form-textarea"
            placeholder={`Jot down details about this ${type}...`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="var(--gray-500)" />
            <label style={{ fontSize: '13px', color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>
              Follow-up Due:
            </label>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '5px 8px', fontSize: '13px' }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Activity'}
          </button>
        </div>
      </form>
    </div>
  );
};
