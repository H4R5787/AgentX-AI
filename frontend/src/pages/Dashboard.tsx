import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bot, Zap, Rocket, Users, Activity, TrendingUp, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { dashboardApi } from '../api/dashboard';
import { Card } from '../components/ui/Card';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingPage } from '../components/ui/Spinner';
import { formatCost } from '../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, iconColor, iconBg, subtitle }) => (
  <Card className="hover:border-border-2 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats,
    refetchInterval: 30_000,
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: dashboardApi.health,
    refetchInterval: 60_000,
  });

  if (isLoading) return <LoadingPage />;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Your AgentX AI platform overview</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/agents/new')} leftIcon={<Bot className="w-4 h-4" />}>
            New Agent
          </Button>
          <Button onClick={() => navigate('/workflows')} leftIcon={<Zap className="w-4 h-4" />}>
            New Workflow
          </Button>
        </div>
      </div>

      {/* System health banner */}
      {health && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${
          health.services?.database === 'ok'
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/5 border-red-500/20 text-red-400'
        }`}>
          {health.services?.database === 'ok'
            ? <CheckCircle className="w-4 h-4" />
            : <AlertCircle className="w-4 h-4" />
          }
          <span>
            {health.services?.database === 'ok'
              ? `All systems operational · Environment: ${health.services?.environment}`
              : 'Database connection issue — some features may be unavailable'
            }
          </span>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Agents"
          value={stats?.total_agents ?? 0}
          icon={Bot}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
          subtitle={`${stats?.active_agents ?? 0} active`}
        />
        <StatCard
          title="Executions"
          value={stats?.total_executions ?? 0}
          icon={Activity}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
          subtitle={`${stats?.active_executions ?? 0} running`}
        />
        <StatCard
          title="Deployments"
          value={stats?.active_deployments ?? 0}
          icon={Rocket}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          subtitle="Phase 4"
        />
        <StatCard
          title="Team Members"
          value={stats?.org_members ?? 0}
          icon={Users}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
      </div>

      {/* Token usage & cost */}
      {((stats?.total_tokens_used ?? 0) > 0 || (stats?.total_cost_usd ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Tokens Used"
            value={(stats?.total_tokens_used ?? 0).toLocaleString()}
            icon={TrendingUp}
            iconColor="text-blue-400"
            iconBg="bg-blue-500/10"
          />
          <StatCard
            title="Estimated Cost"
            value={formatCost(stats?.total_cost_usd ?? 0)}
            icon={Clock}
            iconColor="text-pink-400"
            iconBg="bg-pink-500/10"
          />
        </div>
      )}

      {/* Quick actions + recent executions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <Card header="Quick Actions" className="lg:col-span-1">
          <div className="space-y-2">
            {[
              { label: 'Create Agent', desc: 'Build a new AI agent', path: '/agents/new', icon: Bot, color: 'text-indigo-400' },
              { label: 'View Agents', desc: 'Manage your agents', path: '/agents', icon: Activity, color: 'text-violet-400' },
              { label: 'Monitoring', desc: 'View system metrics', path: '/monitoring', icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Organization', desc: 'Manage team & billing', path: '/organization', icon: Users, color: 'text-amber-400' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-2 transition-colors group text-left"
              >
                <item.icon className={`w-5 h-5 ${item.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-500 truncate">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </button>
            ))}
          </div>
        </Card>

        {/* Recent activity */}
        <Card header="Recent Activity" className="lg:col-span-2">
          {stats?.total_executions === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Activity className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm font-medium">No executions yet</p>
              <p className="text-slate-500 text-xs mt-1">Create an agent and run it to see activity here</p>
              <Button className="mt-4" size="sm" onClick={() => navigate('/agents/new')}>
                Create Your First Agent
              </Button>
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              <p>{stats?.completed_executions ?? 0} completed · {stats?.failed_executions ?? 0} failed</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/monitoring')}>
                View all executions →
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
