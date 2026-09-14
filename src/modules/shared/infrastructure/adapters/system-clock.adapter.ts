import type { Clock } from '#modules/shared/domain/interfaces/clock.interface';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class FixedClock implements Clock {
  constructor(private current: Date) {}
  now(): Date {
    return this.current;
  }
  set(d: Date) {
    this.current = d;
  }
  advance(ms: number) {
    this.current = new Date(this.current.getTime() + ms);
  }
}
