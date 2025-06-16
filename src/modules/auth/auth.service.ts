import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { User } from '@modules/users/entities/user.entity';
import { UserResponseDto } from '@modules/users/dto/user-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ user: UserResponseDto; access_token: string }> {
    const { email, password } = loginDto;

    // Validate password length
    if(password && password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const userLoginResponseDto = plainToInstance(UserResponseDto, user);

    return {
      access_token: this.generateToken(user),
      user: userLoginResponseDto,
    };
  }

  async register(registerDto: RegisterDto): Promise<{ user: UserResponseDto; token: string }> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    // Validate password length
    if( registerDto.password && registerDto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const user = await this.usersService.create(registerDto);

    const token = this.generateToken(user);

    const userRegisterResponseDto = plainToInstance(UserResponseDto, user);

    return {
      user: userRegisterResponseDto,
      token,
    };
  }

  private generateToken(user: { id: string; email: string; role: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.usersService.findOne(userId);
    
    if (!user) {
      return null;
    }
    
    return user;
  }

  async validateUserRoles(userId: string, requiredRoles: string[]): Promise<boolean> {
    return true;
  }
} 