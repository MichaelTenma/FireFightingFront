import {
  Injectable
} from '@angular/core';

import {
  Task,
  GameTimeService
} from './GameTimeService';
import {
  StatusService
} from './StatusService';

import {
  FireThingLayerService
} from './FireThingLayerService';
import {
  FirePoint
} from '../Entity/FirePoint';
import Feature from 'ol/Feature';
import {
  FireCar
} from '../Entity/FireCar';
import {
  UUID
} from '../UUID';
import { PathService } from './PathService';
import { Coordinate } from 'src/BasicOpenlayerType';
import { FireStation } from 'src/Entity/FireStation';
import { RecordService } from './RecordService';
import { StatisticFactorEnum } from 'src/StatisticFactorEnum';
import { transform as proj_transform, fromLonLat } from 'ol/proj';
import { NameService } from './NameService';
import { FireThingEnum } from 'src/FireThingEnum';

@Injectable({
  providedIn: 'root',
})
export class FireService {

  private firePointFeatureList: Array < Feature > ;
  constructor(
    private gameTimeService: GameTimeService,
    private statusService: StatusService,
    private fireThingLayerService: FireThingLayerService,
    private pathService: PathService,
    private recordService: RecordService,
    private nameService: NameService,
  ) {
    this.firePointFeatureList = new Array < Feature > ();
  }

  private static randomFireLevel(): number {
    let randomSecond = FireService.randomFireFoundSecond();
    return FireService.fireLevel(randomSecond);
  }

  private static randomFireFoundSecond(): number {
    let minSecond = 0;
    let maxSecond = minSecond;

    let probArray: number[] = [13.45, 43.46, 32.52, 10.57].map(e => e * 100);
    let secondArray: number[] = [0, 0, 5, 30, 120].map(e => e * 60) /* 最大设定为两小时 */
    // console.log(secondArray);

    let factor = Math.random() * 10000;
    let prob = 0;
    for (let i: number = 0; i < probArray.length; i++) {
      prob += probArray[i];
      if (factor < prob) {
        minSecond = secondArray[i];
        maxSecond = secondArray[i + 1];
        break;
      }
    }

    let randomSecond = Math.random() * (maxSecond - minSecond) + minSecond;
    return randomSecond;
  }

  private static fireLevel(second: number) {
    return 10 * Math.log(second + 1);
  }

  /**
   * 更新火灾点的火势
   */
  public updateFirePoint(whenFireDone: (firePoint: FirePoint) => void) {
    this.gameTimeService.registerTask(() => {
      this.firePointFeatureList.forEach(e => {
        let firePoint: FirePoint = e.get("data");
        firePoint.updateCurrentFireLevel();
        // console.log(firePoint);
      });

      /* 如何消除火灾，从数据源中也必须消除 */
      for (var i = 0; i < this.firePointFeatureList.length; i++) {
        let e: Feature = this.firePointFeatureList[i];
        let firePoint: FirePoint = < FirePoint > FireThingLayerService.getDataFromFeature(e);
        if (firePoint.getCurrentFireLevel() <= 0) {/* 火灾结束 */
          whenFireDone(firePoint);
          FireService.fireOver(
            this.pathService, this.fireThingLayerService, this.statusService, this.recordService, e, 
            firePoint, this.gameTimeService.getGameTime()
          );
          /* 是否能令firePoint指向的内存设置为null, 即将其销毁 */
          this.firePointFeatureList.splice(i, 1); // 将使后面的元素依次前移，数组长度减1
          i--; // 如果不减，将漏掉一个元素
        }
      }
    }, 2, true);
  }

  private static fireOver(
    pathService: PathService, fireThingLayerService: FireThingLayerService, statusService: StatusService,
    recordService: RecordService, firePointFeature: Feature, firePoint: FirePoint,
    currentTime: Date
  ){
    fireThingLayerService.removeFeature(firePointFeature);
    FireService.backFireCars(pathService, fireThingLayerService, firePointFeature);
    let fireTimeSecond = firePoint.getTotalFireSecond(currentTime);
    recordService.addRecord(StatisticFactorEnum.扑灭火灾时间, fireTimeSecond);

    statusService.saveAFire(fireTimeSecond);
  }

  private static backFireCars(
    pathService: PathService, fireThingLayerService: FireThingLayerService, firePointFeature: Feature
  ){
    let startPoint: Coordinate = firePointFeature.getGeometry().getFirstCoordinate();
    let firePoint: FirePoint = < FirePoint > FireThingLayerService.getDataFromFeature(firePointFeature);

    let fireCars: FireCar[] = firePoint.outAllFireCars();
    fireCars.forEach(async (fireCar: FireCar) => {
      let fireStation: FireStation = fireCar.getRefFireStation();
      let fireStationFeature: Feature = fireThingLayerService.getFeatureBy(fireStation);
      let endPoint: Coordinate = fireStationFeature.getGeometry().getFirstCoordinate();
      pathService.registerPath(await pathService.requestPath(
        startPoint, endPoint, firePoint, fireStation, [fireCar]
      ));
    });
    
  }
  public randomFire() {
    return new Task(
      10,
      async () => {
        if (Math.random() < 0.015) {
          /* 1.5%的概率发生火灾 */
          // console.log("随机生成一次火灾");
          let randomFireLevel = FireService.randomFireLevel();
          let randomFireSecond = Math.random() * 120; /* 随机生成一个两分钟内发生的火灾 */
          let fireTime_ms: number = this.gameTimeService.getGameTime().valueOf() + randomFireSecond * 1000;
          let fireTime: Date = new Date(fireTime_ms);

          let randomLon = Math.random() * 0.1 - 0.05;
          let randomLat = Math.random() * 0.1 - 0.05;
          let coordinate = fromLonLat([113.280637 + randomLon, 23.125178 + randomLat]);
          let name: string = await this.nameService.name(proj_transform(coordinate, "EPSG:3857", "EPSG:4326"), FireThingEnum.FirePoint);
          // console.log({randomFireLevel, randomFireSecond});

          //   randomFireLevel = 0;
          this.gameTimeService.registerTask(() => {
            /* 向地图中加入火灾，计算火灾位置 */
            let firePoint: FirePoint = new FirePoint(name, randomFireLevel, fireTime, this.statusService);
            /* test */
            // let fireCar: FireCar = new FireCar(UUID.uuid(), '消防车', null);
            // firePoint.addSaveFirePower([fireCar]);
            // this.fireThingLayerService.add(fireCar, coordinate);
            
            let firePoinrFeature: Feature = this.fireThingLayerService.add(firePoint, coordinate);
            this.firePointFeatureList.push(firePoinrFeature);
          }, randomFireSecond, false);
        }
      }, true
    );
  }
}
