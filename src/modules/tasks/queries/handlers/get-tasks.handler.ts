import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TasksService } from '../../tasks.service';
import { GetTasksQuery } from '../impl/get-tasks.query';
import { plainToInstance } from 'class-transformer';
import { TaskResponseDto } from '../../dto/task-response.dto';

@QueryHandler(GetTasksQuery)
export class GetTasksHandler implements IQueryHandler<GetTasksQuery> {
  constructor(private readonly tasksService: TasksService) {}

  async execute(query: GetTasksQuery) {
    const { queryParams, user } = query;
    const paginatedTasks = await this.tasksService.findAll(queryParams, user);
    paginatedTasks.data = plainToInstance(TaskResponseDto, paginatedTasks.data);
    return paginatedTasks;
    // return this.tasksService.findAll(query.queryParams, query.user);
  }
}
