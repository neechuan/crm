import { describe, it, expect, beforeEach } from 'vitest';
import { CrmDatabase } from '../src/server/db.ts';

describe('Phase 5 - Dashboard Metrics Unit Tests', () => {
  let db: CrmDatabase;

  beforeEach(() => {
    db = new CrmDatabase(':memory:');
  });

  it('accurately computes initial dashboard metrics with no data', () => {
    const metrics = db.getDashboardMetrics();
    expect(metrics.totalRevenueWon).toBe(0);
    expect(metrics.totalDealsWon).toBe(0);
    expect(metrics.pipelineValue).toBe(0);
    expect(metrics.expectedRevenue).toBe(0);
    expect(metrics.dealsWonByMonth).toEqual([]);
    expect(metrics.stageSummaries).toHaveLength(6);
    expect(metrics.recentActivities).toEqual([]);
    expect(metrics.upcomingTasks).toEqual([]);
    expect(metrics.overdueTasks).toEqual([]);
  });

  it('computes won deals and revenue per month accurately', () => {
    // 2 deals won in 2026-08
    db.createDeal({ name: 'August Deal 1', stage: 'Won', value: 20000, close_date: '2026-08-10' });
    db.createDeal({ name: 'August Deal 2', stage: 'Won', value: 35000, close_date: '2026-08-25' });

    // 1 deal won in 2026-09
    db.createDeal({ name: 'Sept Deal', stage: 'Won', value: 50000, close_date: '2026-09-15' });

    // 1 open deal in Negotiation (should not be in won revenue)
    db.createDeal({ name: 'Neg Deal', stage: 'Negotiation', value: 100000, probability: 80, close_date: '2026-10-15' });

    const metrics = db.getDashboardMetrics();
    expect(metrics.totalDealsWon).toBe(3);
    expect(metrics.totalRevenueWon).toBe(105000);

    const aug = metrics.dealsWonByMonth.find(m => m.month === '2026-08');
    expect(aug).toBeDefined();
    expect(aug?.count).toBe(2);
    expect(aug?.revenue).toBe(55000);

    const sept = metrics.dealsWonByMonth.find(m => m.month === '2026-09');
    expect(sept).toBeDefined();
    expect(sept?.count).toBe(1);
    expect(sept?.revenue).toBe(50000);
  });

  it('updates dashboard metrics when a deal is moved to Won', () => {
    const deal = db.createDeal({
      name: 'High-Value Contract',
      stage: 'Proposal',
      value: 80000,
      probability: 60,
      close_date: '2026-09-20'
    });

    const before = db.getDashboardMetrics();
    expect(before.totalRevenueWon).toBe(0);
    expect(before.pipelineValue).toBe(80000);
    expect(before.expectedRevenue).toBe(48000);

    // Update deal to Won
    db.updateDealStage(deal.id, 'Won');

    const after = db.getDashboardMetrics();
    expect(after.totalRevenueWon).toBe(80000);
    expect(after.totalDealsWon).toBe(1);
    expect(after.pipelineValue).toBe(0); // Won deals are no longer in open pipeline
    expect(after.expectedRevenue).toBe(0);
  });

  it('updates task counts when task is added and toggled done', () => {
    const act = db.createActivity({
      type: 'call',
      description: 'Urgent client check-in',
      due_date: '2030-05-01',
      is_done: 0
    });

    const before = db.getDashboardMetrics();
    expect(before.upcomingTasks.some(t => t.id === act.id)).toBe(true);

    // Toggle to done
    db.toggleActivityDone(act.id);

    const after = db.getDashboardMetrics();
    expect(after.upcomingTasks.some(t => t.id === act.id)).toBe(false);
  });
});
