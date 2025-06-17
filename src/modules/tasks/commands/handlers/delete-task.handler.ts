import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TasksService } from '../../tasks.service';
import { DeleteResult } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { DeleteTaskCommand } from '../impl/delete-task.command';

@CommandHandler(DeleteTaskCommand)
export class DeleteTaskHandler implements ICommandHandler<DeleteTaskCommand> {
  constructor(private readonly tasksService: TasksService) {}

  async execute(command: DeleteTaskCommand): Promise<DeleteResult> {
    const { id } = command;
    const removedTask = await this.tasksService.remove(id);
    return plainToInstance(DeleteResult, removedTask);
  }
}
