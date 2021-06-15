import {
  Injectable
} from '@angular/core';

interface Statistic {
  name: string;
  calculate(data: number[]): number;
}

class AverageStatistic implements Statistic {
  readonly name: string = "平均数";
  calculate(data: number[]): number {
    let sum: number = 0.0;
    data.forEach(e => {
      sum += e;
    });
    return sum / data.length;
  }
}

class StandardDeviationStatistic implements Statistic {
  readonly name: string = "标准差";
  constructor(private deviationStatistic: DeviationStatistic) {}
  calculate(data: number[]): number {
    let deviation: number = this.deviationStatistic.calculate(data);
    return Math.sqrt(deviation);
  }

}

class MiddleStatistic implements Statistic {
  readonly name: string = "中位数";
  calculate(data: number[]): number {
    let args: number[] = [...data]; //收集参数转为数组
    args.sort() //排序
    if (args.length % 2 === 0) { //判断数字个数是奇数还是偶数
      return ((args[args.length / 2] + args[args.length / 2 - 1]) / 2); //偶数个取中间两个数的平均数
    } else {
      return args[Math.floor(args.length / 2)]; //奇数个取最中间那个数
    }
  }
}

class ModeStatistic implements Statistic {
  readonly name: string = "众数";
  calculate(data: number[]): number {
    let nums: number[] = [...data];
    let _nums = nums.sort((a, b) => a - b)
    let majority_element = _nums[Math.floor(nums.length / 2)]
    return majority_element;
  }

}

class DeviationStatistic implements Statistic {
  readonly name: string = "方差";

  constructor(
    private averageStatistic: AverageStatistic
  ) {
    this.averageStatistic = averageStatistic
  }

  calculate(data: number[]): number {
    let average: number = this.averageStatistic.calculate(data);
    let upperSum = 0.0;
    data.forEach(e => {
      upperSum += Math.pow(average - e, 2);
    });
    return upperSum / data.length;
  }
}

class Records {
  private data: number[];
  private readonly name: string;
  constructor(name: string) {
    this.name = name;
    this.data = [];
  }

  public addRecord(record: number) {
    this.data.push(record);
  }

  public getName() {
    return this.name;
  }

  getData(): number[] {
    return this.data;
  }
}

export class StatisticResult {
  public readonly name: string;
  public readonly result: number;
  constructor(name: string, result: number) {
    this.name = name;
    this.result = result;
  }
}

@Injectable({
  providedIn: 'root',
})
export class RecordService {

  private recordsList: Records[];
  private statisticMethod: Statistic[];
  constructor() {
    let averageStatistic: AverageStatistic = new AverageStatistic();
    let deviationStatistic: DeviationStatistic = new DeviationStatistic(averageStatistic);
    let standardDeviationStatistic: StandardDeviationStatistic = new StandardDeviationStatistic(deviationStatistic);
    let middleStatistic: MiddleStatistic = new MiddleStatistic();
    let modeStatistic: ModeStatistic = new ModeStatistic();

    this.statisticMethod = [averageStatistic, middleStatistic, modeStatistic, standardDeviationStatistic];
    this.recordsList = [];
  }

  private addRecordsType(recordsName: string): Records {
    let records: Records = this.getRecords(recordsName);;
    if (!records) {
      records = new Records(recordsName);
      this.recordsList.push(records);
    }
    return records;
  }

  private hasRecordsName(recordsName: string): number {
    let index: number = -1;
    for (let i = 0; i < this.recordsList.length; i++) {
      if (this.recordsList[i].getName() === recordsName) {
        index = i;
        break;
      }
    }
    return index;
  }

  private getRecords(recordsName: string): Records {
    let index: number = this.hasRecordsName(recordsName);
    return index < 0 ? null : this.recordsList[index];
  }

  public addRecord(recordsName: string, record: number) {
    let records: Records = this.getRecords(recordsName);
    if (!records) {
      records = this.addRecordsType(recordsName);
    }
    records.addRecord(record);
  }

  public statistic(recordsName: string): StatisticResult[] {
    let statisticResultList: StatisticResult[] = [];

    let records: Records = this.getRecords(recordsName);
    if (!!records) {
      this.statisticMethod.forEach(statistic => {
        let name = statistic.name;
        let result = statistic.calculate(records.getData());

        statisticResultList.push(new StatisticResult(name, result));
      });
    }

    return statisticResultList;
  }
}
