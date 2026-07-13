import { WOStatus, WO_STATUS_TRANSITIONS } from '../constants/enums'

export function isValidStatusTransition(from: WOStatus, to: WOStatus): boolean {
  return WO_STATUS_TRANSITIONS[from].includes(to)
}

export function generateOrgSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

export function generateWOCode(sequence: number): string {
  return `OT-${String(sequence).padStart(6, '0')}`
}

export function calculateTotalCost(params: {
  costHH: number
  costMaterials: number
  costSubcontract: number
  costExtra: number
}): number {
  return (
    (params.costHH || 0) +
    (params.costMaterials || 0) +
    (params.costSubcontract || 0) +
    (params.costExtra || 0)
  )
}
