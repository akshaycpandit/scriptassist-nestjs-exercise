import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, HttpStatus, UseInterceptors, ClassSerializerInterceptor, HttpCode } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DeleteResult } from 'typeorm';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import type { PaginatedResponse, PaginationOptions } from '../../types/pagination.interface';
import { HttpResponse } from '../../types/http-response.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Correct import
import { BatchProcessDto } from './dto/batch-process.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { TaskStatsResponseDto } from './dto/task-stats-response.dto';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { CreateTaskCommand } from './commands/impl/create-task.command';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetTasksQuery } from './queries/impl/get-tasks.query';
import { GetTaskStatsQuery } from './queries/impl/get-task-stats.query';
import { GetTaskByIdQuery } from './queries/impl/get-task-by-id.query';
import { UpdateTaskCommand } from './commands/impl/update-task.command';
import { DeleteTaskCommand } from './commands/impl/delete-task.command';
import { BatchProcessCommand } from './commands/impl/batch-process.command';
import { BatchProcessResponseDto } from './dto/batch-process-response.dto';

@ApiTags('tasks')
@Controller('tasks')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@Roles('ADMIN', 'USER')
@RateLimit({ limit: 100, windowMs: 60000 })
@ApiBearerAuth()
export class TasksController {
  constructor(
    // private readonly tasksService: TasksService, // TasksService moved to CQRS pattern
    private readonly commandBus: CommandBus, // CommandBus for CQRS pattern
    private readonly queryBus: QueryBus, // QueryBus for CQRS pattern
    // Repository moved to service layer
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @Roles('ADMIN')
  async create(@Body() createTaskDto: CreateTaskDto): Promise<HttpResponse<TaskResponseDto>> {
    // const task = await this.tasksService.create(createTaskDto);
    const taskResponse = await this.commandBus.execute(new CreateTaskCommand(createTaskDto));
    
    // const taskResponseDto = plainToInstance(TaskResponseDto, task);

    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      data: taskResponse,
      message: 'Task created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Find all tasks with optional filtering' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @Roles('ADMIN', 'USER')
  async findAll(
    @Query() queryParams: PaginationOptions & { status?: string; priority?: string },
    @CurrentUser() user: { id: string; role: string }
  ): Promise<HttpResponse<PaginatedResponse<TaskResponseDto>>> {

    // let paginatedTasks = await this.tasksService.findAll(queryParams, user);
     const paginatedTasks = await this.queryBus.execute(
      new GetTasksQuery(queryParams, user)
    );

    // paginatedTasks.data = plainToInstance(TaskResponseDto, paginatedTasks.data);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      data: paginatedTasks,
      message: 'Tasks fetched successfully',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  @Roles('ADMIN', 'USER')
  async getStats(
    @CurrentUser() user: { id: string; role: string }
  ): Promise<HttpResponse<TaskStatsResponseDto>> {

    // const stats = await this.tasksService.getStats(user);
    const stats = await this.queryBus.execute(
      new GetTaskStatsQuery(user)
    );
    // const statsResponseDto = plainToInstance(TaskStatsResponseDto, stats);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      data: stats,
      message: 'Task statistics retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a task by ID' })
  @Roles('ADMIN', 'USER')
  async findOne(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }): Promise<HttpResponse<TaskResponseDto>> {

    // const task = await this.tasksService.findOne(id, user);
    // const taskResponseDto = plainToInstance(TaskResponseDto, task);

    const taskResponse = await this.queryBus.execute(
      new GetTaskByIdQuery(id, user)
    );

    return {
      statusCode: HttpStatus.OK,
      success: true,
      data: taskResponse,
      message: 'Task fetched successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @Roles('ADMIN', 'USER')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @CurrentUser() user: { id: string; role: string }): Promise<HttpResponse<TaskResponseDto>> {
    // Validation moved to service layer
    // const updatedTask = await this.tasksService.update(id, updateTaskDto, user);
    // const updatedTaskResponseDto = plainToInstance(TaskResponseDto, updatedTask);
    const updatedTaskResponseDto = await this.commandBus.execute(
      new UpdateTaskCommand(id, updateTaskDto, user)
    );

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: `Task with ID ${id} updated successfully`,
      data: updatedTaskResponseDto,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @Roles('ADMIN')
  async remove(@Param('id') id: string): Promise<HttpResponse<DeleteResult>>  {
    // Validation moved to service layer
    // const removedTask = await this.tasksService.remove(id);
    // const removedTaskResponseDto = plainToInstance(DeleteResult, removedTask);
    const removedTaskResponse = await this.commandBus.execute(
      new DeleteTaskCommand(id)
    );

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: `Task with ID ${id} deleted successfully`,
      data: removedTaskResponse,
    };
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch process multiple tasks' })
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async batchProcess(@Body() operations: BatchProcessDto): Promise<HttpResponse<BatchProcessResponseDto>> {

    const { tasks: taskIds, action } = operations;
    // const results = await this.tasksService.batchProcess(taskIds, action);
    const results = await this.commandBus.execute(
      new BatchProcessCommand(taskIds, action)
    );

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: `Batch ${action} operation completed`,
      data: results,
    };
  }
} 