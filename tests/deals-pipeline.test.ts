import { describe, it, expect, beforeEach } from 'vitest';
import { CrmDatabase } from '../src/server/db.ts';
import type { DealStage } from '../src/types.ts';

describe('Phase 3 - Deals & Pipeline Unit Tests', () => {
  let db: CrmDatabase;

  beforeEach(() => {
    db = new CrmDatabase(':memory:');
  });

  describe('Deals Table & Search', () => {
    it('creates, lists and searches deals across organization and contact names', () => {
      const org = db.createOrganization({ name: 'Solaris Energy' });
      const contact = db.createContact({ name: 'Elena Ray', email: 'elena@solaris.example.com', organization_id: org.id });

      db.createDeal({
        name: 'Solar Grid Automation',
        organization_id: org.id,
        contact_id: contact.id,
        stage: 'Proposal',
        value: 120000,
        probability: 60,
        close_date: '2026-11-30'
      });

      db.createDeal({
        name: 'Battery Backup System',
        organization_id: org.id,
        contact_id: null,
        stage: 'New',
        value: 40000,
        probability: 20,
        close_date: '2026-12-15'
      });

      // Search by deal name
      const byName = db.getAllDeals('Battery');
      expect(byName).toHaveLength(1);
      expect(byName[0].name).toBe('Battery Backup System');

      // Search by company
      const byOrg = db.getAllDeals('Solaris');
      expect(byOrg).toHaveLength(2);

      // Search by contact
      const byContact = db.getAllDeals('Elena');
      expect(byContact).toHaveLength(1);
      expect(byContact[0].name).toBe('Solar Grid Automation');
    });

    it('filters deals by stage', () => {
      db.createDeal({ name: 'D1', stage: 'New', value: 1000, close_date: '2026-10-01' });
      db.createDeal({ name: 'D2', stage: 'Qualified', value: 2000, close_date: '2026-10-02' });
      db.createDeal({ name: 'D3', stage: 'Won', value: 5000, close_date: '2026-10-03' });

      const newDeals = db.getAllDeals(undefined, 'New');
      expect(newDeals).toHaveLength(1);
      expect(newDeals[0].name).toBe('D1');

      const wonDeals = db.getAllDeals(undefined, 'Won');
      expect(wonDeals).toHaveLength(1);
      expect(wonDeals[0].name).toBe('D3');
    });
  });

  describe('Pipeline Drag-and-Drop Stage Transitions', () => {
    it('updates deal stage progressively through pipeline', () => {
      const deal = db.createDeal({
        name: 'Enterprise Contract',
        stage: 'New',
        value: 50000,
        probability: 20,
        close_date: '2026-11-01'
      });

      const stages: DealStage[] = ['Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

      for (const st of stages) {
        const updated = db.updateDealStage(deal.id, st);
        expect(updated).not.toBeNull();
        expect(updated?.stage).toBe(st);

        if (st === 'Won') {
          expect(updated?.probability).toBe(100);
        } else if (st === 'Lost') {
          expect(updated?.probability).toBe(0);
        }
      }
    });

    it('recalculates column totals and expected revenue accurately', () => {
      db.createDeal({ name: 'A', stage: 'Proposal', value: 100000, probability: 50, close_date: '2026-11-01' });
      db.createDeal({ name: 'B', stage: 'Proposal', value: 50000, probability: 60, close_date: '2026-11-15' });
      db.createDeal({ name: 'C', stage: 'Won', value: 70000, probability: 100, close_date: '2026-10-01' });

      const metrics = db.getDashboardMetrics();

      const proposalSummary = metrics.stageSummaries.find(s => s.stage === 'Proposal');
      expect(proposalSummary).toBeDefined();
      expect(proposalSummary?.count).toBe(2);
      expect(proposalSummary?.totalValue).toBe(150000);
      // Expected revenue: 100000 * 0.5 + 50000 * 0.6 = 50000 + 30000 = 80000
      expect(proposalSummary?.expectedRevenue).toBe(80000);

      const wonSummary = metrics.stageSummaries.find(s => s.stage === 'Won');
      expect(wonSummary?.count).toBe(1);
      expect(wonSummary?.totalValue).toBe(70000);
      expect(wonSummary?.expectedRevenue).toBe(70000);
    });
  });
});
