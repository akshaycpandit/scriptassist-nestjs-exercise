import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayNotEmpty, IsIn } from 'class-validator';
// import { TaskStatus } from '../enums/task-status.enum'; // Optional, if using enum validation

export class BatchProcessDto {
  @ApiProperty({ 
    example: [
        '660e8400-e29b-41d4-a716-446655440000',
        '660e8400-e29b-41d4-a716-446655440001',
    ], 
    description: 'Array of task IDs to process' 
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tasks: string[];

  @ApiProperty({ 
    example: 'complete', 
    description: 'Action to perform (e.g. complete or delete)' 
  })
  @IsString()
  @IsIn(['complete', 'delete'])  // Add your valid actions
  action: string;
}
