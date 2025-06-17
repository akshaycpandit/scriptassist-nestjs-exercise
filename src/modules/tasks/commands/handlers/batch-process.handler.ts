import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BatchProcessCommand } from '../impl/batch-process.command';
import { TasksService } from '../../tasks.service';
import { BatchProcessResponseDto } from '@modules/tasks/dto/batch-process-response.dto';

@CommandHandler(BatchProcessCommand)
export class BatchProcessHandler implements ICommandHandler<BatchProcessCommand> {
  constructor(private readonly tasksService: TasksService) {}

  async execute(command: BatchProcessCommand): Promise<BatchProcessResponseDto> {
    const { taskIds, action } = command;
    return this.tasksService.batchProcess(taskIds, action);
  }
}
