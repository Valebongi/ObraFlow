export declare enum Plan {
    STARTER = "STARTER",
    GROWTH = "GROWTH",
    ENTERPRISE = "ENTERPRISE"
}
export declare enum UserRole {
    ORG_ADMIN = "ORG_ADMIN",
    PLANNER = "PLANNER",
    SUPERVISOR = "SUPERVISOR",
    FIELD_LEAD = "FIELD_LEAD",
    VIEWER = "VIEWER"
}
export declare enum WOStatus {
    PENDING = "PENDING",
    ASSIGNED = "ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    INVOICED = "INVOICED",
    CANCELLED = "CANCELLED"
}
export declare enum WOPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum WOType {
    CORRECTIVE = "CORRECTIVE",
    PREVENTIVE = "PREVENTIVE",
    INSTALLATION = "INSTALLATION",
    INSPECTION = "INSPECTION",
    EMERGENCY = "EMERGENCY"
}
export declare enum CrewType {
    OWN = "OWN",
    SUBCONTRACTED = "SUBCONTRACTED"
}
export declare enum CrewStatus {
    AVAILABLE = "AVAILABLE",
    BUSY = "BUSY",
    OFF = "OFF"
}
export declare enum WorkerStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    ON_LEAVE = "ON_LEAVE"
}
export declare enum VehicleStatus {
    AVAILABLE = "AVAILABLE",
    IN_USE = "IN_USE",
    MAINTENANCE = "MAINTENANCE"
}
export declare enum SubRateModel {
    PER_OT = "PER_OT",
    PER_HH = "PER_HH",
    PER_DAY = "PER_DAY"
}
export declare enum MovementType {
    IN = "IN",
    OUT = "OUT",
    TRANSFER = "TRANSFER",
    ADJUSTMENT = "ADJUSTMENT"
}
export declare enum IncidentType {
    SAFETY = "SAFETY",
    QUALITY = "QUALITY",
    DELAY = "DELAY",
    MATERIAL = "MATERIAL",
    OTHER = "OTHER"
}
export declare enum EvidenceType {
    PHOTO = "PHOTO",
    DOCUMENT = "DOCUMENT",
    SIGNATURE = "SIGNATURE"
}
export declare enum NotificationChannel {
    PUSH = "PUSH",
    EMAIL = "EMAIL",
    IN_APP = "IN_APP"
}
export declare const PLAN_LIMITS: Record<Plan, {
    crews: number;
    users: number;
    workOrdersPerMonth: number;
}>;
export declare const WO_STATUS_TRANSITIONS: Record<WOStatus, WOStatus[]>;
export declare const WO_STATUS_COLORS: Record<WOStatus, string>;
