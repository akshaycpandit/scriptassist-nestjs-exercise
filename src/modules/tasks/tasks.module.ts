import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { CommandHandler, CqrsModule } from '@nestjs/cqrs';
import { CreateTaskHandler } from './commands/handlers/create-task.handler';
import { GetTasksHandler } from './queries/handlers/get-tasks.handler';

const commandHandlers = [
  CreateTaskHandler,
  // Add others like UpdateTaskHandler, DeleteTaskHandler, BatchProcessHandler
];

const queryHandlers = [
  GetTasksHandler,
  // Add others like GetTaskByIdHandler, GetStatsHandler
];
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Task]),
    BullModule.registerQueue({
      name: 'task-processing',
    }),
    BullModule.registerQueue({
      name: 'rate-limit',
    }),
  ],
  controllers: [TasksController],
  providers: [
    TasksService,
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [TasksService],
})
export class TasksModule {} 