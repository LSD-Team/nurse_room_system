//  ----- 📖 Library 📖 -----
import { ForbiddenException, HttpStatus } from '@nestjs/common';

export class CustomForbiddenException extends ForbiddenException {
  route: string;
  url: string;
  constructor(message?: string, route: string = '', url: string = '') {
    super(message || 'You do not have permission to view this report data.');

    // Add additional properties
    this.route = route;
    this.url = url;
  }

  getResponse() {
    return {
      statusCode: HttpStatus.FORBIDDEN,
      message: this.message,
      route: this.route,
      url: this.url,
    };
  }
}
