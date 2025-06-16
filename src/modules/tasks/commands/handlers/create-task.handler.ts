import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TasksService } from '../../tasks.service';
import { CreateTaskCommand } from '../impl/create-task.command';
import { TaskResponseDto } from '../../dto/task-response.dto';
import { plainToInstance } from 'class-transformer';

@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler implements ICommandHandler<CreateTaskCommand> {
  constructor(private readonly tasksService: TasksService) {}

  async execute(command: CreateTaskCommand) {
    const { createTaskDto } = command;
    const createdTask = await this.tasksService.create(createTaskDto);
    return plainToInstance(TaskResponseDto, createdTask);
  }
}
