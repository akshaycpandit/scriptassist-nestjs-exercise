export class BatchProcessCommand {
  constructor(
    public readonly taskIds: string[],
    public readonly action: string,
  ) {}
}
