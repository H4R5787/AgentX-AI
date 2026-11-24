import client from './client';
import type { Token, User } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    client.post<Token>('/auth/login', { email, password }).then(r => r.data),

  register: (email: string, password: string, full_name?: string) =>
    client.post<User>('/auth/register', { email, password, full_name }).then(r => r.data),

  me: () => client.get<User>('/auth/me').then(r => r.data),

  refresh: (refresh_token: string) =>
    client.post<Token>('/auth/refresh', { refresh_token }).then(r => r.data),

  logout: () => client.post('/auth/logout').then(r => r.data),
};
