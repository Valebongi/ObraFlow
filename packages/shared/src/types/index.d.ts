import { Plan, UserRole, WOStatus, WOPriority, WOType, CrewType, CrewStatus } from '../constants/enums';
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
}
export interface JwtPayload {
    sub: string;
    email: string;
    orgId: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface LoginResponse {
    user: UserPublic;
    tokens: AuthTokens;
}
export interface UserPublic {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    orgId: string;
    avatarUrl?: string;
    createdAt: string;
}
export interface Organization {
    id: string;
    name: string;
    slug: string;
    plan: Plan;
    logoUrl?: string;
    timezone: string;
    currency: string;
    createdAt: string;
}
export interface WorkOrder {
    id: string;
    code: string;
    title: string;
    description?: string;
    status: WOStatus;
    priority: WOPriority;
    type: WOType;
    orgId: string;
    clientId?: string;
    locationId?: string;
    contractId?: string;
    plannedStart?: string;
    plannedEnd?: string;
    actualStart?: string;
    actualEnd?: string;
    estimatedHours?: number;
    estimatedCost?: number;
    costHH: number;
    costMaterials: number;
    costSubcontract: number;
    costExtra: number;
    costTotal: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export interface WorkOrderSummary {
    id: string;
    code: string;
    title: string;
    status: WOStatus;
    priority: WOPriority;
    type: WOType;
    clientName?: string;
    locationName?: string;
    plannedStart?: string;
    plannedEnd?: string;
    assignedCrewName?: string;
    costTotal: number;
    estimatedHours?: number;
    createdAt: string;
}
export interface Crew {
    id: string;
    name: string;
    code: string;
    type: CrewType;
    status: CrewStatus;
    leaderId?: string;
    vehicleId?: string;
    orgId: string;
    createdAt: string;
}
export interface Client {
    id: string;
    name: string;
    taxId?: string;
    email?: string;
    phone?: string;
    address?: string;
    orgId: string;
    createdAt: string;
}
export interface ApiError {
    statusCode: number;
    message: string | string[];
    error: string;
    timestamp: string;
    path: string;
}
