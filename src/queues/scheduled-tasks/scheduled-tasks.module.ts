import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { OverdueTasksService } from './overdue-tasks.service';
import { TasksModule } from '../../modules/tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '@modules/tasks/entities/task.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'task-processing',
      defaultJobOptions: {
        removeOnComplete: true, // Automatically remove completed jobs
        attempts: 3, // Retry up to 3 times on failure
        backoff: {
          type: 'exponential', // Exponential backoff for retries
          delay: 2000, // Initial delay of 2 seconds
        },
      }
    }),
    TasksModule,
    TypeOrmModule.forFeature([Task]), // 1st Error! -> TaskRepo not imported
  ],
  providers: [OverdueTasksService],
  exports: [OverdueTasksService],
})
export class ScheduledTasksModule {} 