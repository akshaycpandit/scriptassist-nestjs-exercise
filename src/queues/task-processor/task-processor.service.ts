import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TasksService } from '../../modules/tasks/tasks.service';
import { TaskStatus } from '@modules/tasks/enums/task-status.enum';

@Injectable()
// Concurrency to the Task Processing Queue
@Processor('task-processing', { concurrency: 3 })
export class TaskProcessorService extends WorkerHost {
  private readonly logger = new Logger(TaskProcessorService.name);
  constructor(private readonly tasksService: TasksService) {
    super();
  }

  // Inefficient implementation:
  // - No proper job batching
  // - No error handling strategy
  // - No retries for failed jobs
  // - No concurrency control
  async process(job: Job): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    
    try {
      switch (job.name) {
        case 'task-status-update':
          return await this.handleStatusUpdate(job);
        case 'overdue-tasks-notification':
          return await this.handleOverdueTasks(job);
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return { success: false, error: 'Unknown job type' };
      }
    } catch (error) {
      // Basic error logging without proper handling or retries
      this.logger.error(`Error processing job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // Simply rethrows the error without any retry strategy
    }
  }

  private async handleStatusUpdate(job: Job) {
    // Extract relevant keys from job.data
    const { taskId, status } = job.data;
    
    // Throw validation errors for missing or invalid data
    if (!taskId || !status) {
      this.logger.warn(`Invalid data in job ${job.id}`);
      return { success: false, error: 'Missing required data' };
    }

    if (!Object.values(TaskStatus).includes(status)) {
      this.logger.warn(`Invalid status value in job ${job.id}: ${status}`);
      return { success: false, error: 'Invalid status value' };
    }
    
    try{
      this.logger.debug(`Status Update for Task ID ${taskId} to ${status}`);
      const task = await this.tasksService.updateStatus(taskId, status);

      return { 
        success: true,
        taskId: task.id,
        newStatus: task.status
      };

    } catch (error: unknown) {
      this.logger.error(`Failed to update task status for ID ${taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        error: `Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async handleOverdueTasks(job: Job) {
    // Inefficient implementation with no batching or chunking for large datasets
    // The implementation is deliberately basic and inefficient
    // It should be improved with proper batching and error handling

    const { taskIds } = job.data;

    if (!Array.isArray(taskIds) || taskIds.length === 0 || taskIds === undefined) {
      this.logger.warn(`No taskIds provided in overdue-tasks-notification job ${job.id}`);
      return { success: false, reason: 'No taskIds' };
    }

    this.logger.debug('Processing overdue tasks notification');
    // Process in batches (e.g. 10 at a time)
    
    try {
      const result = await this.tasksService.batchProcess(taskIds, 'overdue');
      return { success: true, message: 'Overdue tasks processed', data: result };
    } catch (error: unknown) {
      this.logger.error(`Batch process failed for overdue tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        error: `Batch process failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 