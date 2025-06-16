import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Validate password length
    if(createUserDto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    const existingUser = await this.findByEmail(createUserDto.email);
    
    // Before creating a user, check if email already exists
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async update(
    id: string, 
    updateUserDto: UpdateUserDto, 
    currentUser: { id: string, role: string }
  ): Promise<User> {
    // Validate password length
    if( updateUserDto?.password && updateUserDto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const existingUser = await this.findOne(id);

    // Check if user exists before update
    if( !existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    //  // Before creating a user, check if email already exists
    // if (updateUserDto.email && updateUserDto.email === existingUser.email) {
    //   throw new UnauthorizedException('Email already exists');
    // }
    
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);

      // // Old password check
      // if( updateUserDto.password === existingUser.password) {
      //   throw new BadRequestException('New password cannot be the same as the old password');
      // }
    }

    // Enforce ownership logic
    if (currentUser.role !== 'ADMIN') {
      if (currentUser.id !== id) {
        throw new ForbiddenException('You can only update your own account');
      }

      // Prevent regular user from changing role
      if ('role' in updateUserDto) {
        delete updateUserDto.role;
      }
    }
    
    this.usersRepository.merge(existingUser, updateUserDto);
    return await this.usersRepository.save(existingUser);
  }

  async remove(id: string): Promise<User> {
    const user = await this.findOne(id);
    return await this.usersRepository.remove(user);
  }
} 