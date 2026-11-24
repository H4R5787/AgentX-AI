import client from './client';
import type { DashboardStats } from '../types';

export const dashboardApi = {
  stats: () => client.get<DashboardStats>('/dashboard/stats').then(r => r.data),
  health: () => client.get('/monitoring/health').then(r => r.data),
};
