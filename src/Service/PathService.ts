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
import LineString from 'ol/geom/LineString';
import Polyline from 'ol/format/Polyline';
import {
  HttpClient
} from '@angular/common/http';
import {
  Injectable
} from '@angular/core';
import {
  FireCarScheduleInterface
} from 'src/Entity/FireCarScheduleInterface';
import {
  FireCar
} from 'src/Entity/FireCar';
import {
  Style,
} from 'ol/style';
import {toLonLat, fromLonLat, get as proj_get, transform as proj_transform} from 'ol/proj';
import { FireThingEnum } from 'src/FireThingEnum';

@Injectable({
  providedIn: 'root',
})
export class PathService {
  private pathList: Path[];

  constructor(
    private gameTimeService: GameTimeService,
    private fireThingLayerService: FireThingLayerService,
    private httpClient: HttpClient
  ) {
    this.pathList = [];
  }

  private xxx(){
    // let fireCarStyle: Style = FireThingLayerService.defaultStyle(FireThingEnum.FireCar);
    this.gameTimeService.registerTask(() => {
      this.pathList.forEach(path => {
        let fireCar = path.getFireCar();
        let fireCarFeature: Feature = this.fireThingLayerService.getFeatureBy(fireCar);
        let currentTime: Date = this.gameTimeService.getGameTime();
        let coordinate: Coordinate = path.getCoordinateAt(currentTime.valueOf());
        // coordinate = proj_transform(coordinate, proj_get('EPSG:3857'), proj_get('EPSG:3857'));
        // console.log(currentTime, toLonLat(coordinate));
        // coordinate = fromLonLat([-152.04744131008022, 60.0735251000261], proj_get('EPSG:3857'));
        if (!coordinate) {
          /* 无路可走了 */
          this.fireThingLayerService.setVisibility(fireCarFeature, false);
        }else{
          this.fireThingLayerService.setVisibility(fireCarFeature, true);
          let currentPoint: Point = new Point(coordinate);
          fireCarFeature.setGeometry(currentPoint);
        }
        // this.fireThingLayerService.renderMap();
      })
    }, 5, true);
  }

  public async requestAPath(from: FireCarScheduleInterface, to: FireCarScheduleInterface, fireCars: FireCar[]): Promise < Path > {
    let res = await new Promise < Feature > ((resolve) => {
      this.httpClient.get('https://openlayers.org/en/latest/examples/data/polyline/route.json')
        .subscribe((response: any) => {
          var polyline = response.routes[0].geometry;
          var route = new Polyline({
            factor: 1e6
          }).readGeometry(polyline, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
          });

          var routeFeature = new Feature({
            type: 'route',
            geometry: route,
          });
          routeFeature.set("speed", 36);
          resolve(routeFeature);
        });
    })
    console.log(res);
    return new Path([res], from, to, fireCars[0]);
  }

  public registerPath(path: Path) {
    this.pathList.push(path);
    // this.startAnimation(path);
    path.start(this.gameTimeService.getGameTime().getTime());
    this.xxx();
  }

}
