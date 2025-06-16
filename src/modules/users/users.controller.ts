import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ClassSerializerInterceptor, UseInterceptors, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimitGuard } from '@common/guards/rate-limit.guard';
import { RateLimit } from '@common/decorators/rate-limit.decorator';
import { UserResponseDto } from './dto/user-response.dto';
import { HttpResponse } from '../../types/http-response.interface';
import { plainToInstance } from 'class-transformer';
import { DeleteResult } from 'typeorm';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@Roles('ADMIN')
@RateLimit({ limit: 50, windowMs: 60000 })
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() createUserDto: CreateUserDto): Promise<HttpResponse<UserResponseDto>> {
    const createdUser = await this.usersService.create(createUserDto);

    const createdUserResponseDto = plainToInstance(UserResponseDto, createdUser);

    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      data: createdUserResponseDto,
      message: 'User created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Find all users' })
  async findAll(): Promise<HttpResponse<UserResponseDto[]>> {
    const allusers = await this.usersService.findAll();

    const allusersResponseDto = plainToInstance(UserResponseDto, allusers);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      data: allusersResponseDto,
      message: 'Users fetched successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a user by id' })
  async findOne(@Param('id') id: string): Promise<HttpResponse<UserResponseDto>> {
    const eachUser = await this.usersService.findOne(id);

    const eachUserResponseDto = plainToInstance(UserResponseDto, eachUser);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      data: eachUserResponseDto,
      message: 'User fetched successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<HttpResponse<UserResponseDto>> {
    const updatedUser = await this.usersService.update(id, updateUserDto);

    const updatedUserResponseDto = plainToInstance(UserResponseDto, updatedUser);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      data: updatedUserResponseDto,
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  async remove(@Param('id') id: string): Promise<HttpResponse<DeleteResult>> {
    const deletedUser = await this.usersService.remove(id);

    const deletedUserResponseDto = plainToInstance(DeleteResult, deletedUser);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      data: deletedUserResponseDto,
      message: 'User deleted successfully',
    };
  }
} 