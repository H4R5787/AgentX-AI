import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Organization } from '../types';

interface OrgState {
  currentOrg: Organization | null;
  orgs: Organization[];
  setOrgs: (orgs: Organization[]) => void;
  setCurrentOrg: (org: Organization) => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      currentOrg: null,
      orgs: [],
      setOrgs: (orgs) => set({ orgs, currentOrg: orgs[0] ?? null }),
      setCurrentOrg: (org) => set({ currentOrg: org }),
    }),
    { name: 'agentx-org' }
  )
);
