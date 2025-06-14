import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, HttpException, HttpStatus, UseInterceptors, ClassSerializerInterceptor, HttpCode } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { PaginatedResponse, PaginationOptions } from '../../types/pagination.interface';
import { HttpResponse } from '../../types/http-response.interface';

// This guard needs to be implemented or imported from the correct location
// We're intentionally leaving it as a non-working placeholder
// class JwtAuthGuard {}
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BatchProcessDto } from './dto/batch-process.dto';

@ApiTags('tasks')
@Controller('tasks')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RateLimitGuard)
@RateLimit({ limit: 100, windowMs: 60000 })
@ApiBearerAuth()
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    // Anti-pattern: Controller directly accessing repository
    // @InjectRepository(Task)
    // private taskRepository: Repository<Task>
    // Now service will handle all database interactions
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async create(@Body() createTaskDto: CreateTaskDto): Promise<HttpResponse<Task>> {
    const task = await this.tasksService.create(createTaskDto);

    return {
      success: true,
      data: task,
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
  async findAll(
    @Query() queryParams: PaginationOptions & { status?: string; priority?: string }
  ): Promise<HttpResponse<PaginatedResponse<Task>>> {

    const paginatedTasks = await this.tasksService.findAll(queryParams);

    return {
    success: true,
    data: paginatedTasks,
    message: 'Tasks fetched successfully',
  };
    // return this.tasksService.findAll( { status, priority }, paginationOptions);
    // Inefficient approach: Inconsistent pagination handling
    // if (page && !limit) {
    //   limit = 10; // Default limit
    // }
    
    // // Inefficient processing: Manual filtering instead of using repository
    // let tasks = await this.tasksService.findAll();
    
    // // Inefficient filtering: In-memory filtering instead of database filtering
    // if (status) {
    //   tasks = tasks.filter(task => task.status === status as TaskStatus);
    // }
    
    // if (priority) {
    //   tasks = tasks.filter(task => task.priority === priority as TaskPriority);
    // }
    
    // // Inefficient pagination: In-memory pagination
    // if (page && limit) {
    //   const startIndex = (page - 1) * limit;
    //   const endIndex = page * limit;
    //   tasks = tasks.slice(startIndex, endIndex);
    // }
    
    // return {
    //   data: tasks,
    //   count: tasks.length,
    //   // Missing metadata for proper pagination
    // };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  async getStats(): Promise<HttpResponse<Record<string, number>>> {

    const stats = await this.tasksService.getStats();

    return {
      success: true,
      data: stats,
      message: 'Task statistics retrieved successfully',
    };

    // Inefficient approach: N+1 query problem
    // const tasks = await this.taskRepository.find();
    
    // Inefficient computation: Should be done with SQL aggregation
    // const statistics = {
    //   total: tasks.length,
    //   completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    //   inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    //   pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
    //   highPriority: tasks.filter(t => t.priority === TaskPriority.HIGH).length,
    // };
    
    // return statistics;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a task by ID' })
  async findOne(@Param('id') id: string): Promise<HttpResponse<Task>> {

    const task = await this.tasksService.findOne(id);

    return {
      success: true,
      data: task,
      message: 'Task fetched successfully',
    };

    // const task = await this.tasksService.findOne(id);
    
    // if (!task) {
    //   // Inefficient error handling: Revealing internal details
    //   throw new HttpException(`Task with ID ${id} not found in the database`, HttpStatus.NOT_FOUND);
    // }
    
    // return task;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto): Promise<HttpResponse<Task>> {
    // No validation if task exists before update
    // Validation moved to service layer
    const updatedTask = await this.tasksService.update(id, updateTaskDto);

    return {
      success: true,
      message: `Task with ID ${id} updated successfully`,
      data: updatedTask,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  async remove(@Param('id') id: string): Promise<HttpResponse<DeleteResult>>  {
    // No validation if task exists before removal
    // No status code returned for success
    const removedTask = await this.tasksService.remove(id);

    return {
      success: true,
      message: `Task with ID ${id} deleted successfully`,
      data: removedTask,
    };
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch process multiple tasks' })
  async batchProcess(@Body() operations: BatchProcessDto): Promise<HttpResponse<{ taskId: string; success: boolean; result?: any; error?: string }[]>> {

    const { tasks: taskIds, action } = operations;
    const results = await this.tasksService.batchProcess(taskIds, action);

    return {
      success: true,
      message: `Batch ${action} operation completed`,
      data: results,
    };
    // Inefficient batch processing: Sequential processing instead of bulk operations
    // const { tasks: taskIds, action } = operations;
    // const results = [];
    
    // N+1 query problem: Processing tasks one by one
    // for (const taskId of taskIds) {
    //   try {
    //     let result;
        
    //     switch (action) {
    //       case 'complete':
    //         result = await this.tasksService.update(taskId, { status: TaskStatus.COMPLETED });
    //         break;
    //       case 'delete':
    //         result = await this.tasksService.remove(taskId);
    //         break;
    //       default:
    //         throw new HttpException(`Unknown action: ${action}`, HttpStatus.BAD_REQUEST);
    //     }
        
    //     results.push({ taskId, success: true, result });
    //   } catch (error) {
    //     // Inconsistent error handling
    //     results.push({ 
    //       taskId, 
    //       success: false, 
    //       error: error instanceof Error ? error.message : 'Unknown error'
    //     });
    //   }
    // }
    
    // return results;
  }
} 