import { WOStatus } from '../constants/enums';
export declare function isValidStatusTransition(from: WOStatus, to: WOStatus): boolean;
export declare function generateOrgSlug(name: string): string;
export declare function generateWOCode(sequence: number): string;
export declare function calculateTotalCost(params: {
    costHH: number;
    costMaterials: number;
    costSubcontract: number;
    costExtra: number;
}): number;
