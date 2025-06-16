import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

export class TaskStatsResponseDto {
  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 4 })
  completed: number;

  @ApiProperty({ example: 3 })
  inProgress: number;

  @ApiProperty({ example: 2 })
  pending: number;
  
  @ApiProperty({ example: 2 })
  overdue: number;

  @ApiProperty({ example: 1 })
  highPriority: number;
} 