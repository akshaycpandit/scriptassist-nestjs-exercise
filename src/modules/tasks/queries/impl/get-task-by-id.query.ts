export class GetTaskByIdQuery {
  constructor(
    public readonly id: string,
    public readonly user: { id: string; role: string },
  ) {}
}
