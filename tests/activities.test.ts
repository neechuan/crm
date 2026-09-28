import { describe, it, expect, beforeEach } from 'vitest';
import { CrmDatabase } from '../src/server/db.ts';

describe('Phase 4 - Activities & Tasks Unit Tests', () => {
  let db: CrmDatabase;

  beforeEach(() => {
    db = new CrmDatabase(':memory:');
  });

  it('adds activities of types note, call, email from contacts or deals', () => {
    const contact = db.createContact({ name: 'Frank Miller', email: 'frank@example.com' });
    const deal = db.createDeal({ name: 'Cloud Rollout', value: 30000, close_date: '2026-10-30' });

    const note = db.createActivity({
      type: 'note',
      contact_id: contact.id,
      description: 'Met Frank at Tech Expo; expressed strong interest in cloud services.'
    });

    const call = db.createActivity({
      type: 'call',
      deal_id: deal.id,
      description: 'Discussed implementation timeline and pricing milestones.'
    });

    const email = db.createActivity({
      type: 'email',
      contact_id: contact.id,
      deal_id: deal.id,
      description: 'Sent proposal PDF and terms sheet.'
    });

    expect(note.type).toBe('note');
    expect(call.type).toBe('call');
    expect(email.type).toBe('email');

    // Verify contact timeline
    const contactActivities = db.getAllActivities({ contact_id: contact.id });
    expect(contactActivities).toHaveLength(2);

    // Verify deal timeline
    const dealActivities = db.getAllActivities({ deal_id: deal.id });
    expect(dealActivities).toHaveLength(2);
  });

  it('orders activities chronologically, newest first', () => {
    const contact = db.createContact({ name: 'Test Contact', email: 'test@example.com' });

    db.createActivity({
      type: 'note',
      contact_id: contact.id,
      description: 'Older note',
      happened_at: '2026-09-01 09:00:00'
    });

    db.createActivity({
      type: 'call',
      contact_id: contact.id,
      description: 'Mid note',
      happened_at: '2026-09-05 10:00:00'
    });

    db.createActivity({
      type: 'email',
      contact_id: contact.id,
      description: 'Newest note',
      happened_at: '2026-09-10 11:00:00'
    });

    const activities = db.getAllActivities({ contact_id: contact.id });
    expect(activities[0].description).toBe('Newest note');
    expect(activities[1].description).toBe('Mid note');
    expect(activities[2].description).toBe('Older note');
  });

  it('persists optional due date and toggles task completion', () => {
    const act = db.createActivity({
      type: 'call',
      description: 'Follow up on NDA signature',
      due_date: '2026-10-15',
      is_done: 0
    });

    expect(act.due_date).toBe('2026-10-15');
    expect(act.is_done).toBe(0);

    // Toggle done
    const toggledDone = db.toggleActivityDone(act.id);
    expect(toggledDone?.is_done).toBe(1);

    // Reload from db
    const reloaded1 = db.getActivityById(act.id);
    expect(reloaded1?.is_done).toBe(1);

    // Toggle not done
    const toggledNotDone = db.toggleActivityDone(act.id);
    expect(toggledNotDone?.is_done).toBe(0);

    // Reload again
    const reloaded2 = db.getActivityById(act.id);
    expect(reloaded2?.is_done).toBe(0);
  });

  it('accurately categorizes upcoming and overdue tasks', () => {
    // Overdue task (past date)
    db.createActivity({
      type: 'call',
      description: 'Overdue task',
      due_date: '2020-01-01',
      is_done: 0
    });

    // Upcoming task (future date)
    db.createActivity({
      type: 'email',
      description: 'Upcoming task',
      due_date: '2030-01-01',
      is_done: 0
    });

    // Completed past task (should not appear in pending)
    db.createActivity({
      type: 'note',
      description: 'Completed task',
      due_date: '2020-01-01',
      is_done: 1
    });

    const metrics = db.getDashboardMetrics();
    expect(metrics.overdueTasks.some(t => t.description === 'Overdue task')).toBe(true);
    expect(metrics.upcomingTasks.some(t => t.description === 'Upcoming task')).toBe(true);
    expect(metrics.overdueTasks.some(t => t.description === 'Completed task')).toBe(false);
  });
});
