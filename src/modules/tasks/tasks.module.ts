import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { CommandHandler, CqrsModule } from '@nestjs/cqrs';
import { CreateTaskHandler } from './commands/handlers/create-task.handler';
import { GetTasksHandler } from './queries/handlers/get-tasks.handler';
import { GetTaskStatsHandler } from './queries/handlers/get-tasks-stats.handler';
import { UpdateTaskHandler } from './commands/handlers/update-task.handler';
import { DeleteTaskHandler } from './commands/handlers/delete-task.handler';
import { BatchProcessHandler } from './commands/handlers/batch-process.handler';
import { GetTaskByIdHandler } from './queries/handlers/get-task-by-id.handler';

const commandHandlers = [
  CreateTaskHandler,
  UpdateTaskHandler,
  DeleteTaskHandler,
  BatchProcessHandler,
];

const queryHandlers = [
  GetTasksHandler,
  GetTaskStatsHandler,
  GetTaskByIdHandler,
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