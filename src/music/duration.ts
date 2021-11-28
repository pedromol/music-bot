export class Duration {
  private hours = 0;
  private minutes = 0;
  private seconds = 0;
  private parsed: string | undefined = undefined;

  public addTime(time: string): void {
    this.parsed = undefined;
    const [seconds, minutes, hours] = time
      .split(':')
      .reverse()
      .map((segment) => parseInt(segment));
    this.seconds += seconds ?? 0;
    this.minutes += minutes ?? 0;
    this.hours += hours ?? 0;
  }

  public getTime(): string {
    if (this.parsed) return this.parsed;
    this.minutes += Math.floor(this.seconds / 60) ?? 0;
    this.seconds = this.seconds % 60;

    this.hours += Math.floor(this.minutes / 60) ?? 0;
    this.minutes = this.minutes % 60;

    this.parsed = `${this.hours.toString().padStart(2, '0')}:${this.minutes.toString().padStart(2, '0')}:${this.seconds
      .toString()
      .padStart(2, '0')}`;

    return this.parsed;
  }
}
