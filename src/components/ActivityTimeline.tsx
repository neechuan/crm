import React from 'react';
import type { Activity } from '../types.ts';
import { api } from '../api.ts';
import { FileText, Phone, Mail, CheckCircle2, Clock } from 'lucide-react';

interface ActivityTimelineProps {
  activities: Activity[];
  onActivityChanged: () => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  onActivityChanged,
}) => {
  const handleToggle = async (id: number) => {
    try {
      await api.toggleActivityDone(id);
      onActivityChanged();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'note':
        return <FileText size={16} />;
      case 'call':
        return <Phone size={16} />;
      case 'email':
        return <Mail size={16} />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div style={{ color: 'var(--gray-500)', fontSize: '14px', padding: '16px 0', textAlign: 'center' }}>
        No activity logged yet. Add a note, call, or email above.
      </div>
    );
  }

  const today = new Date().toISOString().substring(0, 10);

  return (
    <div className="timeline">
      {activities.map((act) => {
        const isOverdue = act.due_date && act.is_done === 0 && act.due_date < today;

        return (
          <div key={act.id} className="timeline-item">
            <div className={`timeline-icon ${act.type}`}>
              {getIcon(act.type)}
            </div>

            <div className="timeline-content">
              <div className="timeline-header">
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {act.type}
                  {act.contact_name && (
                    <span style={{ fontWeight: 400, color: 'var(--gray-500)', marginLeft: '6px' }}>
                      with {act.contact_name}
                    </span>
                  )}
                  {act.deal_name && (
                    <span style={{ fontWeight: 400, color: 'var(--gray-500)', marginLeft: '6px' }}>
                      for deal {act.deal_name}
                    </span>
                  )}
                </span>
                <span>{formatDate(act.happened_at)}</span>
              </div>

              <div className="timeline-desc">{act.description}</div>

              {act.due_date && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--gray-100)',
                    fontSize: '12px',
                  }}
                >
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      color: isOverdue ? '#dc2626' : 'var(--gray-700)',
                      fontWeight: isOverdue ? 600 : 500,
                    }}
                  >
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={act.is_done === 1}
                      onChange={() => handleToggle(act.id)}
                    />
                    <span>
                      {act.is_done === 1 ? (
                        <span style={{ textDecoration: 'line-through', color: 'var(--gray-400)' }}>
                          Follow-up completed
                        </span>
                      ) : (
                        <>
                          <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          Due: {act.due_date} {isOverdue && '(Overdue)'}
                        </>
                      )}
                    </span>
                  </label>
                  {act.is_done === 1 && (
                    <CheckCircle2 size={14} color="#047857" style={{ marginLeft: 'auto' }} />
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
