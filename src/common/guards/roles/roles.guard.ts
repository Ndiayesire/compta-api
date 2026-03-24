import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from '../../types/auth-user.type';
import { PERMISSIONS_KEY } from '../../decorators/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const requiredPermissions = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler());

    if ((!requiredRoles || requiredRoles.length === 0) && (!requiredPermissions || requiredPermissions.length === 0)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;
    if (!user || !user.roles) return false;

    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = user.roles.map(ur => ur.role.name.toLowerCase());
      if (!requiredRoles.some(role => userRoles.includes(role.toLowerCase()))) {
        return false;
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = user.roles.flatMap(ur =>
        ur.role.permissions?.map(p => p.permission.name.toLowerCase()) ?? [],
      );
      if (!requiredPermissions.every(permission => userPermissions.includes(permission.toLowerCase()))) {
        return false;
      }
    }

    return true;
  }
}

