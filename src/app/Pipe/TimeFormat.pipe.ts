export class TimeFormatPipe{

  public static transform(value: number): string {
    let second: number = value / 1000.0;
    if (second < 60) {
      return `${second}秒`;
    } else if (second >= 60 && second < 3600) {
      return TimeFormatPipe.secondToMinute(second);
    } else if (second >= 3600 && second < 86400) {
      return TimeFormatPipe.secondToHour(second);
    } else if (second >= 86400) {
      return TimeFormatPipe.secondToDay(second);
    }
  }

  private static secondToMinute(second: number): string {
    let minute: number = Math.floor(second / 60);
    let leftSecond: number = second - minute * 60;
    return `${minute}分钟${leftSecond}秒`;
  }

  private static secondToHour(second: number): string {
    let hour: number = Math.floor(second / 3600);
    return `${hour}小时` + TimeFormatPipe.secondToMinute(second - hour * 3600);
  }

  private static secondToDay(second: number): string {
    let day: number = Math.floor(second / 86400);
    return `${day}天` + TimeFormatPipe.secondToHour(second - day * 86400);
  }
}
