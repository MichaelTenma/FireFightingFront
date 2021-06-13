import {
  FireCar
} from "./FireCar";
import {
  FireCarScheduleInterface
} from './FireCarScheduleInterface';

export class FireStation implements FireCarScheduleInterface {
  private name: String;
  private fireCarList: FireCar[];

  constructor(
    name: String
  ) {
    this.name = name;
    this.fireCarList = [];
  }

  public inFireCars(fireCars: FireCar[]): void {
    fireCars.forEach((fireCar) => {
      this.fireCarList.push(fireCar);
    });
  }
  public outFireCars(fireCars: FireCar[]): FireCar[] {
    let hasFireCarArray: FireCar[] = [];
    fireCars.forEach(fireCar => {
      let index = this.fireCarList.indexOf(fireCar);
      if (index >= 0) {
        this.fireCarList.splice(index, 1);
        hasFireCarArray.push(fireCar);
      }
    });
    return hasFireCarArray;
  }

  public scheduler(fireCarId: String, targetFireStation: FireStation): FireCar {
    /* fireCarList减少一辆车 */
    let fireCar: FireCar = null;
    for (let i: number; i < this.fireCarList.length; i++) {
      if (this.fireCarList[i].getId() === fireCarId) {
        fireCar = this.fireCarList[i];
        delete this.fireCarList[i];

        console.log("delete", fireCar);
        fireCar.setRefFireStation(targetFireStation);
        targetFireStation.addFireCar([fireCar]);
        break;
      }
    }
    return fireCar;
  }

  public addFireCar(fireCarList: FireCar[]) {
    // fireCarList.forEach((fireCar) => {
    //     this.fireCarList.push(fireCar);
    // });
    this.inFireCars(fireCarList);
  }

  public saveFire(numOfFireCar: number): FireCar[] {
    let list: FireCar[] = [];
    if (this.fireCarList.length >= numOfFireCar) {
      for (let i: number = 0; i < numOfFireCar; i++) {
        let fireCar: FireCar = this.fireCarList.pop();
        list.push(fireCar);
      }
    }
    return list;
  }

  public getName(): String {
    return this.name;
  }

  public getNumOfFireCar(): number {
    return this.fireCarList.length;
  }
}
