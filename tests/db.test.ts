import { describe, it, expect, beforeEach } from 'vitest';
import { CrmDatabase } from '../src/server/db.ts';
import { seedDatabase } from '../src/server/seed.ts';

describe('Personal CRM Database - Unit Tests', () => {
  let db: CrmDatabase;

  beforeEach(() => {
    // Isolated in-memory database for every test
    db = new CrmDatabase(':memory:');
  });

  describe('Organizations CRUD', () => {
    it('creates and reads an organization', () => {
      const org = db.createOrganization({
        name: 'Acme Dynamics',
        website: 'https://acme.example.com',
        industry: 'Aerospace',
        notes: 'Strategic defense subcontractor'
      });

      expect(org.id).toBeGreaterThan(0);
      expect(org.name).toBe('Acme Dynamics');
      expect(org.website).toBe('https://acme.example.com');
      expect(org.industry).toBe('Aerospace');
      expect(org.notes).toBe('Strategic defense subcontractor');

      const retrieved = db.getOrganizationById(org.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Acme Dynamics');
      expect(retrieved?.contacts).toEqual([]);
      expect(retrieved?.deals).toEqual([]);
    });

    it('updates an organization', () => {
      const org = db.createOrganization({ name: 'Old Name' });
      const updated = db.updateOrganization(org.id, {
        name: 'New Name Inc',
        website: 'https://newname.example.com',
        industry: 'Technology'
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('New Name Inc');
      expect(updated?.website).toBe('https://newname.example.com');
      expect(updated?.industry).toBe('Technology');
    });

    it('deletes an organization', () => {
      const org = db.createOrganization({ name: 'Delete Me' });
      const deleted = db.deleteOrganization(org.id);
      expect(deleted).toBe(true);

      const retrieved = db.getOrganizationById(org.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Contacts CRUD', () => {
    it('creates and reads a contact', () => {
      const org = db.createOrganization({ name: 'Tech Innovations' });
      const contact = db.createContact({
        name: 'Alice Cooper',
        email: 'alice@example.com',
        phone: '555-0100',
        job_title: 'Chief Architect',
        organization_id: org.id,
        status: 'qualified'
      });

      expect(contact.id).toBeGreaterThan(0);
      expect(contact.name).toBe('Alice Cooper');
      expect(contact.email).toBe('alice@example.com');
      expect(contact.status).toBe('qualified');
      expect(contact.organization_id).toBe(org.id);

      const retrieved = db.getContactById(contact.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.organization_name).toBe('Tech Innovations');
      expect(retrieved?.activities).toEqual([]);
    });

    it('updates a contact', () => {
      const contact = db.createContact({
        name: 'Bob Ross',
        email: 'bob@example.com',
        status: 'lead'
      });

      const updated = db.updateContact(contact.id, {
        status: 'customer',
        job_title: 'Director of Art'
      });

      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('customer');
      expect(updated?.job_title).toBe('Director of Art');
    });

    it('deletes a contact', () => {
      const contact = db.createContact({ name: 'Temporary', email: 'temp@example.com' });
      const deleted = db.deleteContact(contact.id);
      expect(deleted).toBe(true);

      const retrieved = db.getContactById(contact.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Deals CRUD', () => {
    it('creates and reads a deal', () => {
      const org = db.createOrganization({ name: 'Global Corp' });
      const contact = db.createContact({ name: 'John Doe', email: 'john@global.example.com', organization_id: org.id });

      const deal = db.createDeal({
        name: 'Q3 Enterprise Deployment',
        organization_id: org.id,
        contact_id: contact.id,
        stage: 'Proposal',
        value: 75000,
        probability: 60,
        close_date: '2026-10-31'
      });

      expect(deal.id).toBeGreaterThan(0);
      expect(deal.name).toBe('Q3 Enterprise Deployment');
      expect(deal.stage).toBe('Proposal');
      expect(deal.value).toBe(75000);
      expect(deal.probability).toBe(60);

      const retrieved = db.getDealById(deal.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.organization_name).toBe('Global Corp');
      expect(retrieved?.contact_name).toBe('John Doe');
    });

    it('updates deal details and stage', () => {
      const deal = db.createDeal({
        name: 'Mid-market Pilot',
        value: 15000,
        close_date: '2026-11-15'
      });

      const updated = db.updateDeal(deal.id, {
        name: 'Mid-market Pilot Expansion',
        value: 25000
      });
      expect(updated?.name).toBe('Mid-market Pilot Expansion');
      expect(updated?.value).toBe(25000);

      const stageUpdated = db.updateDealStage(deal.id, 'Won');
      expect(stageUpdated?.stage).toBe('Won');
      expect(stageUpdated?.probability).toBe(100);
    });

    it('deletes a deal', () => {
      const deal = db.createDeal({ name: 'To be removed', value: 1000, close_date: '2026-12-01' });
      const deleted = db.deleteDeal(deal.id);
      expect(deleted).toBe(true);

      const retrieved = db.getDealById(deal.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Activities and Tasks CRUD', () => {
    it('creates and reads an activity with follow-up task', () => {
      const contact = db.createContact({ name: 'Jane Doe', email: 'jane@example.com' });
      const activity = db.createActivity({
        type: 'call',
        contact_id: contact.id,
        description: 'Follow up regarding contract redlines',
        due_date: '2026-10-15',
        is_done: 0
      });

      expect(activity.id).toBeGreaterThan(0);
      expect(activity.type).toBe('call');
      expect(activity.description).toBe('Follow up regarding contract redlines');
      expect(activity.due_date).toBe('2026-10-15');
      expect(activity.is_done).toBe(0);

      const retrieved = db.getActivityById(activity.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.contact_name).toBe('Jane Doe');
    });

    it('toggles task completion', () => {
      const activity = db.createActivity({
        type: 'email',
        description: 'Send onboarding deck',
        is_done: 0
      });

      const toggled1 = db.toggleActivityDone(activity.id);
      expect(toggled1?.is_done).toBe(1);

      const toggled2 = db.toggleActivityDone(activity.id);
      expect(toggled2?.is_done).toBe(0);
    });

    it('deletes an activity', () => {
      const activity = db.createActivity({ type: 'note', description: 'Quick note' });
      const deleted = db.deleteActivity(activity.id);
      expect(deleted).toBe(true);

      const retrieved = db.getActivityById(activity.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Realistic Sample Data Seeding', () => {
    it('seeds database with organizations, contacts, deals, and activities', () => {
      expect(db.isEmpty()).toBe(true);
      seedDatabase(db);
      expect(db.isEmpty()).toBe(false);

      const orgs = db.getAllOrganizations();
      const contacts = db.getAllContacts();
      const deals = db.getAllDeals();
      const activities = db.getAllActivities();

      expect(orgs.length).toBeGreaterThanOrEqual(6);
      expect(contacts.length).toBeGreaterThanOrEqual(8);
      expect(deals.length).toBeGreaterThanOrEqual(10);
      expect(activities.length).toBeGreaterThanOrEqual(8);

      // Verify deals span multiple stages
      const stagesPresent = new Set(deals.map(d => d.stage));
      expect(stagesPresent.has('New')).toBe(true);
      expect(stagesPresent.has('Qualified')).toBe(true);
      expect(stagesPresent.has('Proposal')).toBe(true);
      expect(stagesPresent.has('Negotiation')).toBe(true);
      expect(stagesPresent.has('Won')).toBe(true);
      expect(stagesPresent.has('Lost')).toBe(true);
    });
  });
});
