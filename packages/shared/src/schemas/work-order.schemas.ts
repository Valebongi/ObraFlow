import { z } from 'zod'
import { WOStatus, WOPriority, WOType } from '../constants/enums'

export const CreateWorkOrderSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(WOPriority).default(WOPriority.MEDIUM),
  type: z.nativeEnum(WOType),
  clientId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  plannedStart: z.string().datetime().optional(),
  plannedEnd: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  estimatedCost: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
})

export const UpdateWorkOrderSchema = CreateWorkOrderSchema.partial()

export const ChangeWOStatusSchema = z.object({
  status: z.nativeEnum(WOStatus),
  reason: z.string().max(500).optional(),
})

export const WorkOrderFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(WOStatus).optional(),
  priority: z.nativeEnum(WOPriority).optional(),
  type: z.nativeEnum(WOType).optional(),
  clientId: z.string().uuid().optional(),
  crewId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
})

export type CreateWorkOrderDto = z.infer<typeof CreateWorkOrderSchema>
export type UpdateWorkOrderDto = z.infer<typeof UpdateWorkOrderSchema>
export type ChangeWOStatusDto = z.infer<typeof ChangeWOStatusSchema>
export type WorkOrderFiltersDto = z.infer<typeof WorkOrderFiltersSchema>
