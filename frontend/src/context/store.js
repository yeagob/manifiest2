import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  logout: async () => {
    try {
      await api.logout();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  checkAuth: async () => {
    try {
      const user = await api.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));

export const useCausesStore = create((set, get) => ({
  causes: [],
  loading: false,
  error: null,

  fetchCauses: async () => {
    set({ loading: true, error: null });
    try {
      const causes = await api.getCauses();
      set({ causes, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createCause: async (causeData) => {
    try {
      const newCause = await api.createCause(causeData);
      set({ causes: [...get().causes, newCause] });
      return newCause;
    } catch (error) {
      throw error;
    }
  },

  supportCause: async (causeId, interval) => {
    try {
      await api.supportCause(causeId, interval);
      await get().fetchCauses();
    } catch (error) {
      throw error;
    }
  },

  unsupportCause: async (causeId) => {
    try {
      await api.unsupportCause(causeId);
      await get().fetchCauses();
    } catch (error) {
      throw error;
    }
  }
}));

export const useStepsStore = create((set, get) => ({
  totalSteps: 0,
  todaySteps: 0,
  isTracking: false,
  stats: null,

  recordSteps: async (steps) => {
    try {
      const result = await api.recordSteps(steps);
      set({ totalSteps: result.userTotalSteps });
      return result;
    } catch (error) {
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const stats = await api.getStepStats();
      set({ stats, totalSteps: stats.totalSteps });
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  },

  startTracking: () => set({ isTracking: true }),
  stopTracking: () => set({ isTracking: false }),

  addSteps: (count) => set({ todaySteps: get().todaySteps + count })
}));
