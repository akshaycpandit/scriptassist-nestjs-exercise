import { UpdateTaskDto } from '../../dto/update-task.dto';

export class UpdateTaskCommand {
  constructor(
    public readonly id: string,
    public readonly updateTaskDto: UpdateTaskDto,
    public readonly user: { id: string; role: string },
  ) {}
}
