import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BatchProcessResponseDto {
  @ApiProperty({ description: 'Comma-separated list of processed task IDs' })
  taskIds: string;

  @ApiProperty({ description: 'Indicates if the batch operation succeeded' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Result details of the operation', type: Object })
  result?: any;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;
}
