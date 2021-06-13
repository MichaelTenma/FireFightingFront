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
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {
  Style,
  Stroke
} from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';

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
    private httpClient: HttpClient
  ) {
    this.pathList = [];
    this.routeSource = new VectorSource();
    this.routerLayer = new VectorLayer({
      source: this.routeSource,
      style: new Style({
        stroke: new Stroke({
          width: 6,
          color: [237, 212, 0, 0.8],
        }),
      })
    });
    this.moveFeatureInPath();
  }

  private moveFeatureInPath() {
    this.gameTimeService.registerTask(() => {
      this.pathList.forEach(path => {
        let fireCar = path.getFireCar();
        let fireCarFeature: Feature = this.fireThingLayerService.getFeatureBy(fireCar);
        let currentTime: Date = this.gameTimeService.getGameTime();
        let coordinate: Coordinate = path.getCoordinateAt(currentTime.valueOf());
        if (!coordinate) {
          /* 无路可走了 */
          // console.log("无路可走");
          this.fireThingLayerService.setVisibility(fireCarFeature, false);
        } else {
          this.fireThingLayerService.setVisibility(fireCarFeature, true);
          let currentPoint: Point = new Point(coordinate);
          fireCarFeature.setGeometry(currentPoint);
        }
        // this.fireThingLayerService.renderMap();
      })
    }, 5, true);
  }

  // public async requestAPath(from: FireCarScheduleInterface, to: FireCarScheduleInterface, fireCars: FireCar[]): Promise < Path > {
  //   let res = await new Promise < Feature > ((resolve) => {
  //     this.httpClient.get('https://openlayers.org/en/latest/examples/data/polyline/route.json')
  //       .subscribe((response: any) => {
  //         var polyline = response.routes[0].geometry;
  //         var route = new Polyline({
  //           factor: 1e6
  //         }).readGeometry(polyline, {
  //           dataProjection: 'EPSG:4326',
  //           featureProjection: 'EPSG:3857',
  //         });

  //         var routeFeature = new Feature({
  //           type: 'route',
  //           geometry: route,
  //         });
  //         routeFeature.set("speed", 36);
  //         resolve(routeFeature);
  //       });
  //   })
  //   console.log(res);
  //   this.routeSource.addFeature(res);
    
  //   return new Path([res], from, to, fireCars[0]);
  // }

  public async requestAPath(from: FireCarScheduleInterface, to: FireCarScheduleInterface, fireCars: FireCar[]): Promise < Path > {
    let geoJsonFormat: GeoJSON = new GeoJSON();
    let res = await new Promise < Feature[] > ((resolve) => {
      this.httpClient.get('./assets/path.json')
        .subscribe((response) => {
          let fetures: Feature[] = geoJsonFormat.readFeatures(response, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          });

          resolve(fetures);
        });
    })
    console.log(res);
    this.routeSource.addFeatures(res);
    
    return new Path(res, from, to, fireCars[0]);
  }

  public registerPath(path: Path) {
    this.pathList.push(path);
    // this.startAnimation(path);
    path.start(this.gameTimeService.getGameTime().getTime());

  }

  public getRouterLayer(): VectorLayer{
    return this.routerLayer;
  }
}
