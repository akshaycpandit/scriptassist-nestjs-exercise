import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTaskByIdQuery } from '../impl/get-task-by-id.query';
import { TasksService } from '../../tasks.service';
import { TaskResponseDto } from '../../dto/task-response.dto';
import { plainToInstance } from 'class-transformer';

@QueryHandler(GetTaskByIdQuery)
export class GetTaskByIdHandler implements IQueryHandler<GetTaskByIdQuery> {
  constructor(private readonly tasksService: TasksService) {}

  async execute(query: GetTaskByIdQuery): Promise<TaskResponseDto> {
    const { id, user } = query;
    const task = await this.tasksService.findOne(id, user);
    return plainToInstance(TaskResponseDto, task);
  }
}
