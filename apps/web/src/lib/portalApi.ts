import axios, { InternalAxiosRequestConfig } from 'axios';

export const PORTAL_TOKEN_KEY = 'portal_access_token';
export const PORTAL_USER_KEY = 'portal-auth';

export interface PortalUser {
  id: string;
  email: string;
  clientId: string;
  clientName: string;
  orgId: string;
  orgName: string;
}

/** Dedicated axios instance for the client portal (uses the portal JWT). */
export const portalApi = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

portalApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(PORTAL_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function clearPortalSession() {
  localStorage.removeItem(PORTAL_TOKEN_KEY);
  localStorage.removeItem(PORTAL_USER_KEY);
}

export function getPortalUser(): PortalUser | null {
  try {
    const raw = localStorage.getItem(PORTAL_USER_KEY);
    return raw ? (JSON.parse(raw) as PortalUser) : null;
  } catch {
    return null;
  }
}
