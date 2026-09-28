import { describe, it, expect, beforeEach } from 'vitest';
import { CrmDatabase } from '../src/server/db.ts';

describe('Phase 2 - Organizations & Contacts Unit Tests', () => {
  let db: CrmDatabase;

  beforeEach(() => {
    db = new CrmDatabase(':memory:');
  });

  describe('Organizations Add, Edit, Delete, Search', () => {
    it('searches organizations by name, industry, and notes', () => {
      db.createOrganization({ name: 'Alpha Robotics', industry: 'Robotics', notes: 'First client' });
      db.createOrganization({ name: 'Beta Health', industry: 'Healthcare', notes: 'Telehealth pilot' });
      db.createOrganization({ name: 'Gamma Media', industry: 'Publishing', notes: 'SEO agency' });

      // Search by name
      const byName = db.getAllOrganizations('Beta');
      expect(byName).toHaveLength(1);
      expect(byName[0].name).toBe('Beta Health');

      // Search by industry
      const byIndustry = db.getAllOrganizations('Robotics');
      expect(byIndustry).toHaveLength(1);
      expect(byIndustry[0].name).toBe('Alpha Robotics');

      // Search by notes
      const byNotes = db.getAllOrganizations('SEO');
      expect(byNotes).toHaveLength(1);
      expect(byNotes[0].name).toBe('Gamma Media');

      // Search with no matches
      const noMatch = db.getAllOrganizations('Nonexistent');
      expect(noMatch).toHaveLength(0);
    });

    it('returns associated contacts and deals on organization detail', () => {
      const org = db.createOrganization({ name: 'Enterprise Hub' });
      const c1 = db.createContact({ name: 'Alice Smith', email: 'alice@hub.example.com', organization_id: org.id });
      const c2 = db.createContact({ name: 'Bob Jones', email: 'bob@hub.example.com', organization_id: org.id });
      const d1 = db.createDeal({ name: 'Platform License', organization_id: org.id, value: 50000, close_date: '2026-11-01' });

      const detail = db.getOrganizationById(org.id);
      expect(detail).not.toBeNull();
      expect(detail?.contacts).toHaveLength(2);
      expect(detail?.deals).toHaveLength(1);
      expect(detail?.contacts.map(c => c.id)).toContain(c1.id);
      expect(detail?.contacts.map(c => c.id)).toContain(c2.id);
      expect(detail?.deals[0].id).toBe(d1.id);
      expect(detail?.contacts.map(c => c.name)).toContain('Alice Smith');
      expect(detail?.contacts.map(c => c.name)).toContain('Bob Jones');
      expect(detail?.deals[0].name).toBe('Platform License');
    });
  });

  describe('Contacts Add, Edit, Delete, Search & Status Filter', () => {
    it('searches contacts by name and email', () => {
      db.createContact({ name: 'Samantha Clark', email: 'samantha@example.com', status: 'customer' });
      db.createContact({ name: 'Clark Kent', email: 'super@dailyplanet.example.com', status: 'lead' });
      db.createContact({ name: 'Bruce Wayne', email: 'bruce@wayne.example.com', status: 'qualified' });

      // Search by name
      const nameMatch = db.getAllContacts('Clark');
      expect(nameMatch).toHaveLength(2);

      // Search by email
      const emailMatch = db.getAllContacts('dailyplanet');
      expect(emailMatch).toHaveLength(1);
      expect(emailMatch[0].name).toBe('Clark Kent');
    });

    it('filters contacts by status (lead, qualified, customer)', () => {
      db.createContact({ name: 'Lead 1', email: 'lead1@example.com', status: 'lead' });
      db.createContact({ name: 'Lead 2', email: 'lead2@example.com', status: 'lead' });
      db.createContact({ name: 'Qualified 1', email: 'q1@example.com', status: 'qualified' });
      db.createContact({ name: 'Customer 1', email: 'c1@example.com', status: 'customer' });

      const leads = db.getAllContacts(undefined, 'lead');
      expect(leads).toHaveLength(2);
      expect(leads.every(c => c.status === 'lead')).toBe(true);

      const qualified = db.getAllContacts(undefined, 'qualified');
      expect(qualified).toHaveLength(1);
      expect(qualified[0].name).toBe('Qualified 1');

      const customers = db.getAllContacts(undefined, 'customer');
      expect(customers).toHaveLength(1);
      expect(customers[0].name).toBe('Customer 1');
    });

    it('returns linked organization and activity timeline on contact detail', () => {
      const org = db.createOrganization({ name: 'Global Logistics' });
      const contact = db.createContact({
        name: 'Diana Prince',
        email: 'diana@logistics.example.com',
        organization_id: org.id,
        status: 'qualified'
      });

      db.createActivity({
        type: 'call',
        contact_id: contact.id,
        description: 'First intro call',
        happened_at: '2026-09-01 10:00:00'
      });
      db.createActivity({
        type: 'email',
        contact_id: contact.id,
        description: 'Follow-up email with pricing deck',
        happened_at: '2026-09-05 14:00:00'
      });

      const detail = db.getContactById(contact.id);
      expect(detail).not.toBeNull();
      expect(detail?.organization_name).toBe('Global Logistics');
      expect(detail?.activities).toHaveLength(2);
      // Newest activity first
      expect(detail?.activities[0].description).toBe('Follow-up email with pricing deck');
      expect(detail?.activities[1].description).toBe('First intro call');
    });
  });
});
