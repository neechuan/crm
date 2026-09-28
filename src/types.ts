export type ContactStatus = 'lead' | 'qualified' | 'customer';

export type DealStage = 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export type ActivityType = 'note' | 'call' | 'email';

export interface Organization {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contacts_count?: number;
  deals_count?: number;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  organization_id: number | null;
  organization_name?: string | null;
  status: ContactStatus;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: number;
  name: string;
  organization_id: number | null;
  organization_name?: string | null;
  contact_id: number | null;
  contact_name?: string | null;
  stage: DealStage;
  value: number; // in USD
  probability: number; // 0-100 percentage
  close_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  type: ActivityType;
  contact_id: number | null;
  contact_name?: string | null;
  deal_id: number | null;
  deal_name?: string | null;
  description: string;
  happened_at: string;
  due_date: string | null;
  is_done: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  totalRevenueWon: number;
  totalDealsWon: number;
  pipelineValue: number;
  expectedRevenue: number;
  dealsWonByMonth: { month: string; count: number; revenue: number }[];
  stageSummaries: {
    stage: DealStage;
    count: number;
    totalValue: number;
    expectedRevenue: number;
  }[];
  recentActivities: Activity[];
  upcomingTasks: Activity[];
  overdueTasks: Activity[];
}
