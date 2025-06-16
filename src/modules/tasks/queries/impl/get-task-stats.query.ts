export class GetTaskStatsQuery {
  constructor(
    public readonly user: { id: string; role: string },
  ) {}
}
