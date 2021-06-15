import {
  timer
} from 'rxjs';

export class TimeUtil {
  public static sleep(ms_time: number) {
    return new Promise((resolve) => setTimeout(resolve, ms_time));
  }

  public static setTimeout(ms_time: number, lambda: Function) {
    timer(ms_time).subscribe(() => {
      lambda();
    });
  }
}
