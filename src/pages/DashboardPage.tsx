import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { DashboardMetrics } from '../types.ts';
import { api } from '../api.ts';
import {
  DollarSign,
  Briefcase,
  TrendingUp,
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileText,
  Phone,
  Mail,
  Users,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDashboard();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleToggleTask = async (taskId: number) => {
    try {
      await api.toggleActivityDone(taskId);
      loadMetrics();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <FileText size={15} />;
      case 'call':
        return <Phone size={15} />;
      case 'email':
        return <Mail size={15} />;
      default:
        return <FileText size={15} />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading || !metrics) {
    return <div style={{ padding: '24px' }}>Loading sales dashboard...</div>;
  }

  // Format chart data for monthly won performance
  const chartData = (metrics.dealsWonByMonth || []).map((item) => ({
    month: item.month,
    Revenue: item.revenue,
    DealsWon: item.count,
  }));

  // Format chart data for pipeline breakdown
  const pipelineChartData = (metrics.stageSummaries || [])
    .filter((s) => s.stage !== 'Lost')
    .map((s) => ({
      stage: s.stage,
      'Total Value': s.totalValue,
      'Expected Revenue': s.expectedRevenue,
      count: s.count,
    }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--gray-900)' }}>
            Sales Dashboard
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginTop: '2px' }}>
            At-a-glance performance, active pipeline forecasting, and follow-ups.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadMetrics}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Revenue Won</div>
            <div className="kpi-value" style={{ color: '#047857' }}>
              ${metrics.totalRevenueWon.toLocaleString()}
            </div>
            <div className="kpi-sub">{metrics.totalDealsWon} deals closed won</div>
          </div>
          <div className="kpi-icon-container" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Pipeline Value</div>
            <div className="kpi-value" style={{ color: 'var(--crm-blue)' }}>
              ${metrics.pipelineValue.toLocaleString()}
            </div>
            <div className="kpi-sub">Active deals in pipeline</div>
          </div>
          <div className="kpi-icon-container" style={{ backgroundColor: 'var(--crm-blue-light)', color: 'var(--crm-blue-dark)' }}>
            <Briefcase size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Expected Revenue</div>
            <div className="kpi-value" style={{ color: 'var(--crm-purple)' }}>
              ${metrics.expectedRevenue.toLocaleString()}
            </div>
            <div className="kpi-sub">Weighted by close probability</div>
          </div>
          <div className="kpi-icon-container" style={{ backgroundColor: 'var(--crm-purple-light)', color: 'var(--crm-purple-dark)' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Follow-ups Pending</div>
            <div className="kpi-value" style={{ color: metrics.overdueTasks.length > 0 ? '#dc2626' : 'var(--gray-900)' }}>
              {metrics.upcomingTasks.length + metrics.overdueTasks.length}
            </div>
            <div className="kpi-sub">
              {metrics.overdueTasks.length > 0 ? (
                <span style={{ color: '#dc2626', fontWeight: 600 }}>
                  {metrics.overdueTasks.length} overdue
                </span>
              ) : (
                'All on schedule'
              )}
            </div>
          </div>
          <div
            className="kpi-icon-container"
            style={{
              backgroundColor: metrics.overdueTasks.length > 0 ? '#fee2e2' : 'var(--crm-amber-light)',
              color: metrics.overdueTasks.length > 0 ? '#dc2626' : 'var(--crm-amber-dark)',
            }}
          >
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Monthly Deals Won & Revenue */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">
              <DollarSign size={18} color="var(--crm-blue)" /> Revenue & Deals Won Per Month
            </h3>
          </div>
          {chartData.length === 0 ? (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', fontSize: '14px' }}>
              No deals closed as Won yet.
            </div>
          ) : (
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--gray-600)' }} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: 'var(--gray-600)' }}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: 'var(--gray-600)' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === 'Revenue') return [`$${Number(value).toLocaleString()}`, 'Revenue Won'];
                      return [value, 'Deals Won'];
                    }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="Revenue" fill="var(--crm-blue)" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="DealsWon" fill="var(--crm-amber)" name="Deals Won" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pipeline Summary & Expected Revenue Visualization */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} color="var(--crm-purple)" /> Pipeline Stage Value & Expected Revenue
            </h3>
            <Link to="/pipeline" className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
              Board <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
                <XAxis dataKey="stage" tick={{ fontSize: 12, fill: 'var(--gray-600)' }} />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--gray-600)' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [`$${Number(value).toLocaleString()}`, name]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Total Value" fill="var(--crm-blue)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expected Revenue" fill="var(--crm-purple)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tasks & Activities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
        {/* Follow-up Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={18} color="var(--crm-amber-dark)" /> Tasks & Follow-ups
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
              Check box to mark completed
            </span>
          </div>

          {/* Overdue Tasks Section */}
          {metrics.overdueTasks.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                <AlertCircle size={14} /> Overdue Tasks ({metrics.overdueTasks.length})
              </div>
              <div style={{ border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', backgroundColor: '#fff5f5' }}>
                {metrics.overdueTasks.map((t) => (
                  <div key={t.id} className="task-item">
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={t.is_done === 1}
                      onChange={() => handleToggleTask(t.id)}
                    />
                    <div className="task-info">
                      <div className="task-text">{t.description}</div>
                      <div className="task-meta">
                        <span className="task-overdue">Due: {t.due_date}</span>
                        {t.contact_name && (
                          <Link to={`/contacts/${t.contact_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            <Users size={11} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                            {t.contact_name}
                          </Link>
                        )}
                        {t.deal_name && (
                          <Link to={`/deals/${t.deal_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            <Briefcase size={11} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                            {t.deal_name}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks Section */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-600)', marginBottom: '8px' }}>
              Upcoming Tasks ({metrics.upcomingTasks.length})
            </div>
            {metrics.upcomingTasks.length === 0 ? (
              <div style={{ color: 'var(--gray-500)', fontSize: '13px', padding: '12px 0' }}>
                No upcoming tasks scheduled. Log an activity on any contact or deal to schedule a follow-up.
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                {metrics.upcomingTasks.map((t) => (
                  <div key={t.id} className="task-item">
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={t.is_done === 1}
                      onChange={() => handleToggleTask(t.id)}
                    />
                    <div className="task-info">
                      <div className="task-text">{t.description}</div>
                      <div className="task-meta">
                        <span style={{ color: 'var(--crm-blue-dark)', fontWeight: 500 }}>
                          Due: {t.due_date}
                        </span>
                        {t.contact_name && (
                          <Link to={`/contacts/${t.contact_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            <Users size={11} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                            {t.contact_name}
                          </Link>
                        )}
                        {t.deal_name && (
                          <Link to={`/deals/${t.deal_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            <Briefcase size={11} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                            {t.deal_name}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <CheckCircle2 size={18} color="var(--crm-blue)" /> Recent Activity Feed
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
              Latest updates across CRM
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
            {metrics.recentActivities.length === 0 ? (
              <div style={{ color: 'var(--gray-500)', fontSize: '13px', padding: '12px 0' }}>
                No recent activities found.
              </div>
            ) : (
              metrics.recentActivities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ffffff',
                    fontSize: '13px',
                  }}
                >
                  <div className={`timeline-icon ${act.type}`} style={{ width: '28px', height: '28px' }}>
                    {getActivityIcon(act.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: 'var(--gray-500)', fontSize: '11px' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--gray-700)' }}>
                        {act.type}
                      </span>
                      <span>{formatDate(act.happened_at)}</span>
                    </div>
                    <div style={{ color: 'var(--gray-800)', marginBottom: '4px' }}>
                      {act.description}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--gray-500)' }}>
                      {act.contact_name && (
                        <Link to={`/contacts/${act.contact_id}`} style={{ color: 'var(--crm-blue)', textDecoration: 'none' }}>
                          <Users size={11} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                          {act.contact_name}
                        </Link>
                      )}
                      {act.deal_name && (
                        <Link to={`/deals/${act.deal_id}`} style={{ color: 'var(--crm-purple)', textDecoration: 'none' }}>
                          <Briefcase size={11} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                          {act.deal_name}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
