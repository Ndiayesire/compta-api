import {Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDtoValidation } from './dto/login-dto';
import { RegisterDtoValidation } from './dto/register-dto';
import { RefreshTokenDto } from './dto/refresh-token-dto';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@example.com' },
        password: { type: 'string', example: 'P@ssw0rd!' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Login successful' },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJI...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJI...' },
          },
        },
      },
    },
  })
  async login(@Body() loginDto: LoginDtoValidation) {
    const tokens = await this.authService.login(loginDto);
    return {
      success: true,
      message: 'Login successful',
      data: tokens,
    };
  }

  @Post('register')
  @Public()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user and return tokens' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'newuser@example.com' },
        password: { type: 'string', example: 'P@ssw0rd!' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        phone: { type: 'string', example: '+221771234567' },
        companyId: { type: 'string', example: '8a9b...' },
        roleIds: { type: 'array', items: { type: 'string', example: 'role-uuid' } },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Registration successful' },
      },
    },
  })
  async register(@Body() registerDto: RegisterDtoValidation) {
    const user = await this.authService.register(registerDto);
    return {
      success: true,
      message: 'Registration successful',
    //   data: user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string', example: 'eyJhbGciOiJI...' },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Tokens refreshed successfully' },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJI...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJI...' },
          },
        },
      },
    },
  })
  async refresh(
    @CurrentUser() user: AuthUser,
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    const tokens = await this.authService.refreshTokens(user.id, refreshTokenDto.refreshToken);
    return {
      success: true,
      message: 'Tokens refreshed successfully',
      data: tokens,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout the user (invalidate refresh token)' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Logout successful' },
        data: { type: 'null', example: null },
      },
    },
  })
  async logout(@CurrentUser() user: AuthUser) {
    await this.authService.logout(user.id);
    return {
      success: true,
      message: 'Logout successful',
      data: null,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Returns current authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Profile retrieved successfully' },
        data: { type: 'object' },
      },
    },
  })
  async getProfile(@CurrentUser() user: AuthUser) {
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
    };
  }
}