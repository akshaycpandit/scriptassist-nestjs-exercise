// src/tasks/commands/handlers/update-task.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateTaskCommand } from '../impl/update-task.command';
import { TasksService } from '../../tasks.service';
import { TaskResponseDto } from '../../dto/task-response.dto';
import { plainToInstance } from 'class-transformer';

@CommandHandler(UpdateTaskCommand)
export class UpdateTaskHandler implements ICommandHandler<UpdateTaskCommand> {
  constructor(private readonly tasksService: TasksService) {}

  async execute(command: UpdateTaskCommand): Promise<TaskResponseDto> {
    const { id, updateTaskDto, user } = command;
    const updatedTask = await this.tasksService.update(id, updateTaskDto, user);
    return plainToInstance(TaskResponseDto, updatedTask);
  }
}
