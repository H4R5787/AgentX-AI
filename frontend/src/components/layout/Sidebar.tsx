import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bot, Wrench, GitBranch, Rocket, Server,
  BookOpen, Shield, BarChart2, Key, Settings, Building2,
  Zap, LogOut, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/auth';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Agents', path: '/agents', icon: Bot },
  { label: 'Agent Builder', path: '/agents/new', icon: Wrench },
  { label: 'Workflows', path: '/workflows', icon: GitBranch },
  { label: 'Deployments', path: '/deployments', icon: Rocket },
  { label: 'Runtime Nodes', path: '/runtime-nodes', icon: Server },
  { label: 'Knowledge Base', path: '/knowledge', icon: BookOpen },
  { label: 'Cybersecurity', path: '/cybersecurity', icon: Shield },
  { label: 'Monitoring', path: '/monitoring', icon: BarChart2 },
  { label: 'API Keys', path: '/api-keys', icon: Key },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Organization', path: '/organization', icon: Building2 },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'AX';

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen bg-surface border-r border-border z-40 flex flex-col transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-border gap-3 shrink-0', collapsed && 'justify-center px-0')}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-lg tracking-tight">AgentX AI</span>
        )}
        <button
          onClick={onToggle}
          className={cn('ml-auto text-slate-400 hover:text-white transition-colors p-1 rounded', collapsed && 'ml-0')}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/dashboard'}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
              isActive
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-slate-400 hover:text-white hover:bg-surface-2',
              collapsed && 'justify-center px-0 w-10 mx-auto'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className={cn('border-t border-border p-3 shrink-0', collapsed && 'flex flex-col items-center gap-2')}>
        <div className={cn('flex items-center gap-3', collapsed && 'flex-col')}>
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
