import {
  WOStatus,
  WOPriority,
  WOType,
  UserRole,
  CrewStatus,
  CrewType,
  WorkerStatus,
  VehicleStatus,
  Plan,
  SubRateModel,
} from '@obraflow/shared';

type Tone = 'gray' | 'yellow' | 'green' | 'blue' | 'red' | 'purple' | 'orange';

export const WO_STATUS_LABEL: Record<WOStatus, string> = {
  [WOStatus.PENDING]: 'Pendiente',
  [WOStatus.ASSIGNED]: 'Asignada',
  [WOStatus.IN_PROGRESS]: 'En ejecución',
  [WOStatus.PAUSED]: 'Pausada',
  [WOStatus.COMPLETED]: 'Completada',
  [WOStatus.INVOICED]: 'Facturada',
  [WOStatus.CANCELLED]: 'Cancelada',
};

export const WO_STATUS_TONE: Record<WOStatus, Tone> = {
  [WOStatus.PENDING]: 'gray',
  [WOStatus.ASSIGNED]: 'blue',
  [WOStatus.IN_PROGRESS]: 'yellow',
  [WOStatus.PAUSED]: 'orange',
  [WOStatus.COMPLETED]: 'green',
  [WOStatus.INVOICED]: 'gray',
  [WOStatus.CANCELLED]: 'red',
};

export const WO_PRIORITY_LABEL: Record<WOPriority, string> = {
  [WOPriority.LOW]: 'Baja',
  [WOPriority.MEDIUM]: 'Media',
  [WOPriority.HIGH]: 'Alta',
  [WOPriority.CRITICAL]: 'Crítica',
};

export const WO_PRIORITY_TONE: Record<WOPriority, Tone> = {
  [WOPriority.LOW]: 'gray',
  [WOPriority.MEDIUM]: 'blue',
  [WOPriority.HIGH]: 'orange',
  [WOPriority.CRITICAL]: 'red',
};

export const WO_TYPE_LABEL: Record<WOType, string> = {
  [WOType.CORRECTIVE]: 'Correctiva',
  [WOType.PREVENTIVE]: 'Preventiva',
  [WOType.INSTALLATION]: 'Instalación',
  [WOType.INSPECTION]: 'Inspección',
  [WOType.EMERGENCY]: 'Emergencia',
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.ORG_ADMIN]: 'Administrador',
  [UserRole.PLANNER]: 'Planificador',
  [UserRole.SUPERVISOR]: 'Supervisor',
  [UserRole.FIELD_LEAD]: 'Jefe de Cuadrilla',
  [UserRole.VIEWER]: 'Visualizador',
};

export const CREW_STATUS_LABEL: Record<CrewStatus, string> = {
  [CrewStatus.AVAILABLE]: 'Disponible',
  [CrewStatus.BUSY]: 'Ocupada',
  [CrewStatus.OFF]: 'Fuera de servicio',
};

export const CREW_STATUS_TONE: Record<CrewStatus, Tone> = {
  [CrewStatus.AVAILABLE]: 'green',
  [CrewStatus.BUSY]: 'yellow',
  [CrewStatus.OFF]: 'gray',
};

export const CREW_TYPE_LABEL: Record<CrewType, string> = {
  [CrewType.OWN]: 'Propia',
  [CrewType.SUBCONTRACTED]: 'Subcontratada',
};

export const WORKER_STATUS_LABEL: Record<WorkerStatus, string> = {
  [WorkerStatus.ACTIVE]: 'Activo',
  [WorkerStatus.INACTIVE]: 'Inactivo',
  [WorkerStatus.ON_LEAVE]: 'De licencia',
};

export const WORKER_STATUS_TONE: Record<WorkerStatus, Tone> = {
  [WorkerStatus.ACTIVE]: 'green',
  [WorkerStatus.INACTIVE]: 'gray',
  [WorkerStatus.ON_LEAVE]: 'orange',
};

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  [VehicleStatus.AVAILABLE]: 'Disponible',
  [VehicleStatus.IN_USE]: 'En uso',
  [VehicleStatus.MAINTENANCE]: 'Mantenimiento',
};

export const VEHICLE_STATUS_TONE: Record<VehicleStatus, Tone> = {
  [VehicleStatus.AVAILABLE]: 'green',
  [VehicleStatus.IN_USE]: 'blue',
  [VehicleStatus.MAINTENANCE]: 'orange',
};

export const PLAN_LABEL: Record<Plan, string> = {
  [Plan.STARTER]: 'Starter',
  [Plan.GROWTH]: 'Growth',
  [Plan.ENTERPRISE]: 'Enterprise',
};

export const SUB_RATE_MODEL_LABEL: Record<SubRateModel, string> = {
  [SubRateModel.PER_OT]: 'Por OT',
  [SubRateModel.PER_HH]: 'Por HH',
  [SubRateModel.PER_DAY]: 'Por día',
};
