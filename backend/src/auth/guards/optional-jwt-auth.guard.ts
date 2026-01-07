import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Always allow the request through, but try to authenticate
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Don't throw on errors - just return null user
    if (err || !user) {
      return null;
    }
    return user;
  }
}
