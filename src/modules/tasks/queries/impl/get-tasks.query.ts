export class GetTasksQuery {
  constructor(
    public readonly queryParams: any,
    public readonly user: { id: string; role: string },
  ) {}
}
