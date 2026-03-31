import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('App')
@Controller('/health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get API status and health check' })
  @ApiResponse({
    status: 200,
    description: 'API is running and healthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'API is running' },
        data: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Insta Compta API' },
            version: { type: 'string', example: '1.0' },
            timestamp: { type: 'string', example: '2026-03-23T12:00:00.000Z' }
          }
        }
      }
    }
  })
  getStatus() {
    return this.appService.getStatus();
  }
}