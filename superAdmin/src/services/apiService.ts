import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { School, CreateSchoolPayload, FirstAdminPayload } from '../types/school';
import { SuperAdmin, CreateSuperAdminPayload } from '../types/superAdmin';
import { Student } from '../types/student';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiService = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

apiService.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error: any) => {
  return Promise.reject(error);
});

apiService.interceptors.response.use((response: AxiosResponse) => {
  return response;
}, async (error: any) => {
  if (error.response?.status === 401) {
    await supabase.auth.signOut();
  }
  return Promise.reject(error);
});

export const superAdminApi = {
  getStudents: async (): Promise<Student[]> => {
    const response = await apiService.get('/api/super-admin/students');
    return response.data;
  },

  getSchools: async (): Promise<School[]> => {
    const response = await apiService.get('/api/super-admin/schools');
    return response.data;
  },

  getSchool: async (id: number): Promise<School> => {
    const response = await apiService.get(`/api/super-admin/schools/${id}`);
    return response.data;
  },

  createSchool: async (data: CreateSchoolPayload): Promise<School> => {
    const response = await apiService.post('/api/super-admin/schools', data);
    return response.data;
  },

  seedSchoolDefaults: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.post(`/api/super-admin/schools/${id}/seed-defaults`);
    return response.data;
  },

  toggleSchoolActive: async (id: number, is_active: boolean, notes?: string): Promise<School> => {
    const payload: any = { is_active };
    if (notes) payload.notes = notes;
    const response = await apiService.patch(`/api/super-admin/schools/${id}`, payload);
    return response.data;
  },

  addFirstAdmin: async (schoolId: number, data: FirstAdminPayload): Promise<any> => {
    const response = await apiService.post(`/api/super-admin/schools/${schoolId}/first-admin`, data);
    return response.data;
  },

  // --- DASHBOARD & HEALTH ---
  getDashboardStats: async (): Promise<{ total_schools: number; active_schools: number; total_students: number; total_staff: number; total_super_admins: number }> => {
    const response = await apiService.get('/api/super-admin/dashboard/stats');
    return response.data;
  },

  getSchoolHealth: async (id: number): Promise<{ student_count: number; staff_count: number; user_count: number; last_activity: string | null; defaults_seeded: boolean; first_admin_exists: boolean }> => {
    const response = await apiService.get(`/api/super-admin/schools/${id}/health`);
    return response.data;
  },

  // --- SUPER ADMIN MANAGEMENT ---
  getSuperAdmins: async (): Promise<SuperAdmin[]> => {
    const response = await apiService.get('/api/super-admin/admins');
    return response.data;
  },

  createSuperAdmin: async (data: CreateSuperAdminPayload): Promise<SuperAdmin> => {
    const response = await apiService.post('/api/super-admin/admins', data);
    return response.data;
  },

  toggleSuperAdminActive: async (id: string, is_active: boolean): Promise<SuperAdmin> => {
    const response = await apiService.patch(`/api/super-admin/admins/${id}`, { is_active });
    return response.data;
  },

  deleteSuperAdmin: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiService.delete(`/api/super-admin/admins/${id}`);
    return response.data;
  }
};
