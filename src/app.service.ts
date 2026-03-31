import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      success: true,
      message: 'API is running',
      data: {
        name: 'Insta Compta API',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
    };
  }
}