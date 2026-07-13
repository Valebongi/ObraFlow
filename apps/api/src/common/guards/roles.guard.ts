import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@obraflow/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ORG_ADMIN]: 5,
  [UserRole.PLANNER]: 4,
  [UserRole.SUPERVISOR]: 3,
  [UserRole.FIELD_LEAD]: 2,
  [UserRole.VIEWER]: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0)
      return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user)
      throw new ForbiddenException('No autorizado');
    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const requiredLevel = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r] ?? 999));
    if (userLevel < requiredLevel) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }
    return true;
  }
}
