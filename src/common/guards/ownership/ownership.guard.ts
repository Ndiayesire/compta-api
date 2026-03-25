import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../roles/roles.guard';
import type { AuthUser } from '../../types/auth-user.type';

@Injectable()
export class OwnershipGuard extends RolesGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check authentication and roles
    const isAuthorized = await super.canActivate(context);
    if (!isAuthorized) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;
    const params = request.params;
    const body = request.body;

    // Check ownership based on route and user
    const resourceId = params.id || params.userId || body.userId;

    if (resourceId && user.id !== resourceId) {
      // Check if user is admin or has permission to access other users
      const userRole = user.role?.name || '';
      const hasAdminRole = ['admin', 'super_admin', 'manager'].includes(userRole.toLowerCase());

      if (!hasAdminRole) {
        // Check if user owns the company
        if (user.companyId && body.companyId && user.companyId !== body.companyId) {
          throw new ForbiddenException('You can only access resources from your company');
        }

        // For user-specific resources, only allow access to own resources
        if (resourceId && user.id !== resourceId) {
          throw new ForbiddenException('You can only access your own resources');
        }
      }
    }

    return true;
  }
}