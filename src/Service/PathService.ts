import {
  Path,
  Route
} from '../Entity/Path';
import {
  GameTimeService
} from './GameTimeService';
import {
  FireThingLayerService
} from './FireThingLayerService';
import {
  getVectorContext
} from 'ol/render';
import {
  Coordinate
} from '../BasicOpenlayerType';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {
  Injectable
} from '@angular/core';
import {
  FireCarScheduleInterface
} from 'src/Entity/FireCarScheduleInterface';
import {
  FireCar
} from 'src/Entity/FireCar';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {
  Style,
  Stroke
} from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import {HttpService} from './HttpService';
import WKT from 'ol/format/WKT';

import {TimeUtil} from '../TimeUtil';
import {RecordService} from './RecordService';
import { StatisticFactorEnum } from '../StatisticFactorEnum';
import { FireThingEnum } from 'src/FireThingEnum';

const wktFormat = new WKT();
@Injectable({
  providedIn: 'root',
})
export class PathService {
  private pathList: Path[];
  private routeSource: VectorSource;
  private routerLayer: VectorLayer;
  constructor(
    private gameTimeService: GameTimeService,
    private fireThingLayerService: FireThingLayerService,
    private httpService: HttpService,
    private recordService: RecordService
  ) {
    this.pathList = [];
    this.routeSource = new VectorSource();
    this.routerLayer = new VectorLayer({
      source: this.routeSource,
      style: new Style({
        stroke: new Stroke({
          width: 7,
          color: [28, 248, 28, 1.00],
        }),
      })
    });
    this.moveFeatureInPath();
  }

  private moveFeatureInPath() {
    this.gameTimeService.registerTask(() => {

      for (var i = 0; i < this.pathList.length; i++) {
        let path: Path = this.pathList[i];
        let fireCar = path.getFireCar();
        let fireCarFeature: Feature = this.fireThingLayerService.getFeatureBy(fireCar);
        let currentTime: Date = this.gameTimeService.getGameTime();
        let coordinate: Coordinate = path.getCoordinateAt(currentTime.valueOf());
        if (!coordinate) {
          /* 无路可走了，到达目的地 */
          PathService.achieveTheDestination(this.recordService, path, currentTime);
          this.fireThingLayerService.setVisibility(fireCarFeature, false);
          this.pathList.splice(i, 1); // 将使后面的元素依次前移，数组长度减1
          i--; // 如果不减，将漏掉一个元素
        } else {
          this.fireThingLayerService.setVisibility(fireCarFeature, true);
          let currentPoint: Point = new Point(coordinate);
          fireCarFeature.setGeometry(currentPoint);
        }
      }
    }, 5, true);
  }

  private static achieveTheDestination(recordService: RecordService, path: Path, currentTime: Date){
    path.inFireCar();
    path.removePath();
    if(path.isToType() === FireThingEnum.FirePoint){
      /* 前往灭火的路径时间 */
      recordService.addRecord(StatisticFactorEnum.消防车到达时间, path.getTotalRunSecond(currentTime));
    }
  }

  public async requestPath(
    fromPoint: Coordinate, toPoint: Coordinate, 
    from: FireCarScheduleInterface, to: FireCarScheduleInterface, 
    fireCars: FireCar[]
  ): Promise < Path[] > {
    let data = await this.httpService.getFromEnd(`/route/getBestRoute?x1=${fromPoint[0]}&y1=${fromPoint[1]}&x2=${toPoint[0]}&y2=${toPoint[1]}&srid=3857`);
    let routeFeatures: Feature[] = [];
    data.route.forEach(e => {
      // e.segment
      let routeFeature: Feature = wktFormat.readFeature(e.segment, {
        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857'
      });

      let speed: number = e.speed;
      let cost: number = e.cost;
      routeFeature.set("speed", speed);
      routeFeature.set("cost", cost);
      routeFeatures.push(routeFeature);
    })
    // console.log({routeFeatures});
    // this.routeSource.addFeatures(routeFeatures);

    let routes: Route[] = Path.transformFeaturesToRoutes(routeFeatures);

    let paths: Path[] = [];
    fireCars.forEach(e => {
      let path: Path = new Path(routes, from, to, e, this.routeSource);
      paths.push(path);
    });
    return paths;
  }

  public registerPath(paths: Path[]) {
    for(let i = 0; i < paths.length;i++){
      let path = paths[i];
      path.displayPath();
      /* 每辆车相隔一个游戏分钟出警 */
      path.start(this.gameTimeService.getGameTime().getTime() + i * 60 * 1000);
      this.pathList.push(path);
    }
  }

  public getRouterLayer(): VectorLayer{
    return this.routerLayer;
  }
}
