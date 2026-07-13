export enum Plan {
  STARTER = 'STARTER',
  GROWTH = 'GROWTH',
  ENTERPRISE = 'ENTERPRISE',
}

export enum UserRole {
  ORG_ADMIN = 'ORG_ADMIN',
  PLANNER = 'PLANNER',
  SUPERVISOR = 'SUPERVISOR',
  FIELD_LEAD = 'FIELD_LEAD',
  VIEWER = 'VIEWER',
}

export enum WOStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  INVOICED = 'INVOICED',
  CANCELLED = 'CANCELLED',
}

export enum WOPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum WOType {
  CORRECTIVE = 'CORRECTIVE',
  PREVENTIVE = 'PREVENTIVE',
  INSTALLATION = 'INSTALLATION',
  INSPECTION = 'INSPECTION',
  EMERGENCY = 'EMERGENCY',
}

export enum CrewType {
  OWN = 'OWN',
  SUBCONTRACTED = 'SUBCONTRACTED',
}

export enum CrewStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  OFF = 'OFF',
}

export enum WorkerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum SubRateModel {
  PER_OT = 'PER_OT',
  PER_HH = 'PER_HH',
  PER_DAY = 'PER_DAY',
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum IncidentType {
  SAFETY = 'SAFETY',
  QUALITY = 'QUALITY',
  DELAY = 'DELAY',
  MATERIAL = 'MATERIAL',
  OTHER = 'OTHER',
}

export enum EvidenceType {
  PHOTO = 'PHOTO',
  DOCUMENT = 'DOCUMENT',
  SIGNATURE = 'SIGNATURE',
}

export enum NotificationChannel {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
}

export const PLAN_LIMITS: Record<Plan, { crews: number; users: number; workOrdersPerMonth: number }> = {
  [Plan.STARTER]: { crews: 5, users: 10, workOrdersPerMonth: 200 },
  [Plan.GROWTH]: { crews: 20, users: 40, workOrdersPerMonth: 1000 },
  [Plan.ENTERPRISE]: { crews: Infinity, users: Infinity, workOrdersPerMonth: Infinity },
}

export const WO_STATUS_TRANSITIONS: Record<WOStatus, WOStatus[]> = {
  [WOStatus.PENDING]: [WOStatus.ASSIGNED, WOStatus.CANCELLED],
  [WOStatus.ASSIGNED]: [WOStatus.IN_PROGRESS, WOStatus.PENDING, WOStatus.CANCELLED],
  [WOStatus.IN_PROGRESS]: [WOStatus.PAUSED, WOStatus.COMPLETED, WOStatus.CANCELLED],
  [WOStatus.PAUSED]: [WOStatus.IN_PROGRESS, WOStatus.CANCELLED],
  [WOStatus.COMPLETED]: [WOStatus.INVOICED],
  [WOStatus.INVOICED]: [],
  [WOStatus.CANCELLED]: [],
}

export const WO_STATUS_COLORS: Record<WOStatus, string> = {
  [WOStatus.PENDING]: '#8E9196',
  [WOStatus.ASSIGNED]: '#1E88E5',
  [WOStatus.IN_PROGRESS]: '#F5C518',
  [WOStatus.PAUSED]: '#FB8C00',
  [WOStatus.COMPLETED]: '#43A047',
  [WOStatus.INVOICED]: '#111111',
  [WOStatus.CANCELLED]: '#E53935',
}
