import { Component, OnInit } from '@angular/core';
import { RecordService, StatisticResult } from 'src/Service/RecordService';
import { StatisticFactorEnum } from 'src/StatisticFactorEnum';

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.css']
})
export class StatisticComponent implements OnInit {

  content: string;
  statisticResultList: StatisticResult[];
  constructor(private recordService: RecordService) { }

  ngOnInit(): void {

  }

  public statistic(factor: StatisticFactorEnum){
    this.statisticResultList = this.recordService.statistic(factor);
    // let content: string = factor + ":\n";
    // statisticResult.forEach(e => {
    //   content += e.name + ":" + e.result;
    // });
    // this.content = content;
  }

  public getStatisticFactorList(): StatisticFactorEnum[]{
    return [StatisticFactorEnum.消防车到达时间, StatisticFactorEnum.扑灭火灾时间];
  }

}
