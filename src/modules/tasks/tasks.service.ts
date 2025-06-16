import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskStatus } from './enums/task-status.enum';
import { PaginatedResponse, PaginationOptions } from '../../types/pagination.interface';
import { TaskPriority } from './enums/task-priority.enum';
import { TaskResponseDto } from './dto/task-response.dto';
import { plainToInstance } from 'class-transformer';
import { TaskStatsResponseDto } from './dto/task-stats-response.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectQueue('task-processing')
    private taskQueue: Queue,
  ) {}

   private readonly logger = new Logger(TasksService.name);

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    // Single transaction
    return await this.tasksRepository.manager.transaction(async (manager) => {
      const task = manager.create(Task, createTaskDto);
      const savedTask = await manager.save(task);

      try {
        // Add created task id to queue for notification
        await this.taskQueue.add('task-status-update', {
          taskId: savedTask.id,
          status: savedTask.status,
        });
      } catch (queueError: unknown) {

        // Rollback or log critical error
        this.logger.error(
          `Failed to enqueue job for task ${savedTask.id}: ${queueError instanceof Error ? queueError.stack : queueError}`
        );

        throw new InternalServerErrorException('Failed to process task status update while enqueuing job');
      }

      return savedTask;
    });
    // Inefficient implementation: creates the task but doesn't use a single transaction
    // for creating and adding to queue, potential for inconsistent state
    // const task = this.tasksRepository.create(createTaskDto);
    // const savedTask = await this.tasksRepository.save(task);

    // Add to queue without waiting for confirmation or handling errors
    // this.taskQueue.add('task-status-update', {
    //   taskId: savedTask.id,
    //   status: savedTask.status,
    // });

    // return savedTask;
  }

  async findAll(
    params: PaginationOptions & { status?: string; priority?: string }
  ): Promise<PaginatedResponse<TaskResponseDto>> {
    
    // Extract essential params only
    const { status, priority, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = params;
    
    const query = this.tasksRepository.createQueryBuilder('task');

    if (status) query.andWhere('task.status = :status', { status });
    if (priority) query.andWhere('task.priority = :priority', { priority });

    query.orderBy(`task.${sortBy}`, sortOrder);
    query.skip((page - 1) * limit).take(limit);

    // Extract pagination essentials count from query
    let [data, total] = await query.getManyAndCount();
    
    const taskResponse = plainToInstance(TaskResponseDto, data);

    return {
      data: taskResponse,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Inefficient implementation: retrieves all tasks without pagination
    // and loads all relations, causing potential performance issues
    // return this.tasksRepository.find({
    //   relations: ['user'],
    // });
  }

  async getStats(): Promise<TaskStatsResponseDto> {

    // Raw query for statistical data retrieval
    let stats = await this.tasksRepository
      .createQueryBuilder('task')
      .select([
        'COUNT(*) as total',
        `COALESCE(SUM(CASE WHEN task.status = :completed THEN 1 ELSE 0 END), 0) as completed`,
        `COALESCE(SUM(CASE WHEN task.status = :inProgress THEN 1 ELSE 0 END), 0) as inProgress`,
        `COALESCE(SUM(CASE WHEN task.status = :pending THEN 1 ELSE 0 END), 0) as pending`,
        `COALESCE(SUM(CASE WHEN task.status = :overdue THEN 1 ELSE 0 END), 0) as overdue`,
        `COALESCE(SUM(CASE WHEN task.priority = :high THEN 1 ELSE 0 END), 0) as highPriority`,
      ])
      .setParameters({
        completed: TaskStatus.COMPLETED,
        inProgress: TaskStatus.IN_PROGRESS,
        pending: TaskStatus.PENDING,
        overdue: TaskStatus.OVERDUE,
        high: TaskPriority.HIGH,
      })
      .getRawOne();

    stats = plainToInstance(TaskStatsResponseDto, stats);

    // Cast values to number because getRawOne returns string values from DB
    return {
      total: parseInt(stats.total, 10),
      completed: parseInt(stats.completed, 10),
      inProgress: parseInt(stats.inprogress, 10),
      pending: parseInt(stats.pending, 10),
      highPriority: parseInt(stats.highpriority, 10),
    };
  }

  async findOne(id: string): Promise<Task> {

    const task = await this.tasksRepository.findOne({
      where: { id },
      // relations: ['user'], // Relations not required as userId is sufficient
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
    // Inefficient implementation: two separate database calls
    // const count = await this.tasksRepository.count({ where: { id } });

    // if (count === 0) {
    //   throw new NotFoundException(`Task with ID ${id} not found`);
    // }

    // return (await this.tasksRepository.findOne({
    //   where: { id },
    //   relations: ['user'],
    // })) as Task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    // Encapsulate complete process in a transaction
    return await this.tasksRepository.manager.transaction(async (manager) => {
      const task = await manager.findOne(Task, {
        where: { id },
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      const originalStatus = task.status;

      // Apply only changed fields
      this.tasksRepository.merge(task, updateTaskDto);
      const updatedTask = await manager.save(task);

      // Enqueue job for status update and notify
      if (originalStatus !== updatedTask.status) {
        try {
          await this.taskQueue.add('task-status-update', {
            taskId: updatedTask.id,
            status: updatedTask.status,
          });
        } catch (queueError: unknown) {

          // Rollback or log critical error
          this.logger.error(
            `Failed to enqueue job for task ${updatedTask.id}: ${queueError instanceof Error ? queueError.stack : queueError}`
          );

          throw new InternalServerErrorException('Failed to process task status update while enqueuing job');
        }
      }

      return updatedTask;
    });
    // Inefficient implementation: multiple database calls
    // and no transaction handling
    // const task = await this.findOne(id);

    // const originalStatus = task.status;

    // Directly update each field individually
    // if (updateTaskDto.title) task.title = updateTaskDto.title;
    // if (updateTaskDto.description) task.description = updateTaskDto.description;
    // if (updateTaskDto.status) task.status = updateTaskDto.status;
    // if (updateTaskDto.priority) task.priority = updateTaskDto.priority;
    // if (updateTaskDto.dueDate) task.dueDate = updateTaskDto.dueDate;

    // const updatedTask = await this.tasksRepository.save(task);

    // Add to queue if status changed, but without proper error handling
    // if (originalStatus !== updatedTask.status) {
    //   this.taskQueue.add('task-status-update', {
    //     taskId: updatedTask.id,
    //     status: updatedTask.status,
    //   });
    // }

    // return updatedTask;
  }

  async remove(id: string): Promise<DeleteResult> {

    // Single separate database call for delete
    const deleteResult = await this.tasksRepository.delete(id);

    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return deleteResult;
    
    // Inefficient implementation: two separate database calls
    // const task = await this.findOne(id);
    // await this.tasksRepository.remove(task);
  }

  // FindAll does the same operation, this function is redundant
  // async findByStatus(status: TaskStatus): Promise<Task[]> {
  //   // Inefficient implementation: doesn't use proper repository patterns
  //   const query = 'SELECT * FROM tasks WHERE status = $1';
  //   return this.tasksRepository.query(query, [status]);
  // }

  async updateStatus(id: string, status: string): Promise<Task> {
    // This method will be called by the task processor
    const task = await this.findOne(id);  

    if(task.status === status) {
      this.logger.log(`Task ${task.id} already has status ${status}`);    
      return task; // No change needed (Create or Update without tassk status change)
    }
    task.status = status as TaskStatus;
    return this.tasksRepository.save(task);
  }

  // Can be used from api as well as from task processor
  async batchProcess(taskIds: string[], action: string): Promise<{ taskIds: string, success: boolean, result?: any, error?: string }> {
    try {
      // Fixed tasks based on actions on taskIds -> Status change, delete tasks
      switch (action) {
        case 'complete':
          const completeResult = await this.tasksRepository
            .createQueryBuilder()
            .update(Task)
            .set({ status: TaskStatus.COMPLETED })
            .whereInIds(taskIds)
            .execute();
  
          return {
            taskIds: taskIds.join(', '),
            success: true,
            result: completeResult,
          };
  
        case 'delete':
          const deleteResult = await this.tasksRepository
            .createQueryBuilder()
            .delete()
            .from(Task)
            .whereInIds(taskIds)
            .execute();
  
          return {
            taskIds: taskIds.join(', '),
            success: true,
            result: deleteResult,
          };
  
        case 'overdue':
          const overdueResult = await this.tasksRepository
            .createQueryBuilder()
            .update(Task)
            .set({ status: TaskStatus.OVERDUE })
            .whereInIds(taskIds)
            .execute();
  
          return {
            taskIds: taskIds.join(', '),
            success: true,
            result: overdueResult,
          };
  
        default:
          throw new BadRequestException(`Unknown action: ${action}`);
      }
    } catch (error: unknown) {
       this.logger.error(`Batch process failed: ${error instanceof Error ? error.message : error}`);
      return {
        taskIds: taskIds.join(', '),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during batch processing',
      };
    }
  }
}
