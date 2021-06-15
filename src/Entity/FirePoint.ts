import {
  FireCar
} from './FireCar';
import {
  StatusService
} from '../Service/StatusService';

import {
  BasicMath
} from '../BasicMath';
import {
  FireCarScheduleInterface
} from './FireCarScheduleInterface';

export class FirePoint implements FireCarScheduleInterface {
  private changedFireLevel: number; /* 灭火力量改变后火势 */
  private changedFireTime: Date; /* 灭火力量改变时间 */
  private saveFirePower: FireCar[]; /* 灭火力量 */

  private currentFireLevel: number; /* 临时记录当前的火势，避免渲染时频繁更新currentFireLevel */
  private needSecond: number;

  /* 不可修改 */
  private readonly fireOriginalLevel: number; /* 起火规模 */
  private readonly fireOriginalTime: Date; /* 起火时间 */

  constructor(
    起火规模: number, 起火时间: Date,
    private statusService: StatusService
  ) {
    this.fireOriginalLevel = 起火规模;
    this.fireOriginalTime = 起火时间;
    this.changedFireLevel = this.fireOriginalLevel;
    this.changedFireTime = this.fireOriginalTime;
    this.saveFirePower = [];

    this.currentFireLevel = this.fireOriginalLevel;
  }

  public inFireCars(fireCars: FireCar[]): void {
    this.addSaveFirePower(fireCars);
  }
  public outFireCars(fireCars: FireCar[]): FireCar[] {
    return this.removeSaveFirePower(fireCars);
  }

  public outAllFireCars(): FireCar[]{
    let fireCars: FireCar[] = [];
    this.saveFirePower.forEach(fireCar => fireCars.push(fireCar));
    return this.outFireCars(fireCars);
  }

  private saveFirePowerChange() {
    /* 更新 */
    let currentTime = this.statusService.getGameTime();
    this.currentFireLevel = this.currentFireLevelWithCurrentTime(currentTime);

    /* 当前火势计算完成，可以修改 */
    this.changedFireLevel = this.currentFireLevel;
    this.changedFireTime = currentTime;
  }

  public addSaveFirePower(fireCarArray: FireCar[]): void {
    /**
     * 灭火力量发生改变，重新计算 
     * 根据上一次改变后的火势以及火势改变时间计算当前时间点理论上的火势
     * 一旦某一火灾点的灭火力量发生改变，系统按照某一函数进行改变火势，
     */
    this.saveFirePowerChange();

    /* 最后才增加灭火力量 */
    fireCarArray.forEach((fireCar) => {
      this.saveFirePower.push(fireCar);
    });
  }

  public removeSaveFirePower(fireCarArray: FireCar[]): FireCar[] {
    /**
     * 灭火力量发生改变，重新计算 
     * 根据上一次改变后的火势以及火势改变时间计算当前时间点理论上的火势
     * 一旦某一火灾点的灭火力量发生改变，系统按照某一函数进行改变火势，
     */
    this.saveFirePowerChange();

    /* 最后才减少灭火力量 */
    let hasFireCarArray: FireCar[] = [];
    let deleteElementIndex: number[] = [];
    fireCarArray.forEach(fireCar => {
      let index = this.saveFirePower.indexOf(fireCar);
      if (index >= 0) {
        // this.saveFirePower.splice(index, 1);
        hasFireCarArray.push(fireCar);
        deleteElementIndex.push(index);
      }
    });

    deleteElementIndex.forEach(index => {
      delete this.saveFirePower[index];
    });

    for(let i = 0;i < this.saveFirePower.length;i++){
      if(!this.saveFirePower[i]){
        this.saveFirePower.splice(i, 1);
        i--;
      }
    }
    return hasFireCarArray;
  }

  private static saveFire(numOfFireCar: number): number {
    return 0.1066433 * numOfFireCar;
  }

  private static fireLevel(second: number): number {
    return 10 * Math.log(second + 1);
  }

  public getNumOfFireCar(): number {
    return this.saveFirePower.length;
  }

  /**
   * A - B
   */
  private static differSecond(A: Date, B: Date): number {
    return (A.valueOf() - B.valueOf()) / 1000.0;
  }

  private static calCurrentFireLevel(lastS: number, nowS: number, numOfFireCar: number, lLevel: number) {
    return FirePoint.fireLevel(nowS) - (FirePoint.fireLevel(lastS) - lLevel) - FirePoint.saveFire(numOfFireCar) * (nowS - lastS);
  }
  private currentFireLevelWithCurrentTime(currentTime: Date): number {
    let numOfFireCar: number = this.getNumOfFireCar();
    let nowS: number = FirePoint.differSecond(currentTime, this.fireOriginalTime);
    let lastS: number = FirePoint.differSecond(this.changedFireTime, this.fireOriginalTime);
    // let oLevel: number = this.fireOriginalLevel;
    let lLevel: number = this.changedFireLevel;
    return FirePoint.calCurrentFireLevel(lastS, nowS, numOfFireCar, lLevel);
  }

  public getCurrentFireLevel(): number {
    return this.currentFireLevel;
  }

  public updateCurrentFireLevel() {
    let currentTime = this.statusService.getGameTime();
    this.currentFireLevel = this.currentFireLevelWithCurrentTime(currentTime);

    this.needSecond = this.needSecondForSaveFire(currentTime, this.currentFireLevel);
  }

  private needSecondForSaveFire(currentTime: Date, currentFireLevel: number): number {
    let currentS = FirePoint.differSecond(currentTime, this.fireOriginalTime);

    /* 参见文档火灾点类设计 */
    let m = this.getNumOfFireCar();

    let a = 10.0;
    let b = -FirePoint.saveFire(m);
    let c = FirePoint.fireLevel(currentS) - currentFireLevel - FirePoint.saveFire(m) * (currentS + 1);

    let needSecond = -1 - currentS;
    /* 假设当前还没被扑灭，且一定能在10天之内扑灭 */
    needSecond += BasicMath.solve(currentS, currentS + 864000, (x: number) => a * Math.log(x) + b * x - c);
    return needSecond;
  }

  public getNeedSecond(): number {
    return this.needSecond;
  }
}
