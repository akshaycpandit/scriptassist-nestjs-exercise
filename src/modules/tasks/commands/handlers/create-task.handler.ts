import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TasksService } from '../../tasks.service';
import { CreateTaskCommand } from '../impl/create-task.command';

@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler implements ICommandHandler<CreateTaskCommand> {
  constructor(private readonly tasksService: TasksService) {}

  async execute(command: CreateTaskCommand) {
    return this.tasksService.create(command.createTaskDto);
  }
}
