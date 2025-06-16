import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiTags } from '@nestjs/swagger';
import { HttpResponse } from '../../types/http-response.interface';
import { UserResponseDto } from '@modules/users/dto/user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<HttpResponse<{ access_token: string; user: UserResponseDto }>> {
    const loginResponse = await this.authService.login(loginDto);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      data: loginResponse,
      message: 'Login successful',
    }
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<HttpResponse<{ user: UserResponseDto; token: string }>> {
    const registerUser = await this.authService.register(registerDto);

    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      data: registerUser,
      message: 'User registered successfully',
    };
  }
} 