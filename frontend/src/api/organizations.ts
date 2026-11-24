import client from './client';
import type { Organization, OrgMembership } from '../types';

export const orgsApi = {
  list: () => client.get<Organization[]>('/organizations').then(r => r.data),
  create: (name: string, slug?: string) =>
    client.post<Organization>('/organizations', { name, slug }).then(r => r.data),
  get: (id: string) => client.get<Organization>(`/organizations/${id}`).then(r => r.data),
  members: (id: string) => client.get<OrgMembership[]>(`/organizations/${id}/members`).then(r => r.data),
};
