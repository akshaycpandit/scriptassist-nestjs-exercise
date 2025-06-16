import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTaskStatsQuery } from '../impl/get-task-stats.query';
import { TasksService } from '../../tasks.service';
import { TaskStatsResponseDto } from '../../dto/task-stats-response.dto';
import { plainToInstance } from 'class-transformer';

@QueryHandler(GetTaskStatsQuery)
export class GetTaskStatsHandler implements IQueryHandler<GetTaskStatsQuery> {
  constructor(private readonly tasksService: TasksService) {}

  async execute(query: GetTaskStatsQuery): Promise<TaskStatsResponseDto> {
    const { user } = query;
    const stats = await this.tasksService.getStats(user);
    return plainToInstance(TaskStatsResponseDto, stats);
  }
}
