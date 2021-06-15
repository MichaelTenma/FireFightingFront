import {
  Injectable
} from '@angular/core';
import {
  HttpService
} from './HttpService';
import WKT from 'ol/format/WKT';
import {
  Coordinate
} from '../BasicOpenlayerType';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {
    Style,
    Stroke
  } from 'ol/style';

const wktFormat = new WKT();
@Injectable({
  providedIn: 'root',
})
export class ServiceAreaService {

  private routeSource: VectorSource;
  private routerLayer: VectorLayer;
  constructor(
    private httpService: HttpService
  ) {
    this.routeSource = new VectorSource();
    this.routerLayer = new VectorLayer({
      source: this.routeSource,
      style: new Style({
        stroke: new Stroke({
          width: 3.5,
          color: [141, 90, 153, 1.00],
        }),
      })
    });
  }

  public async calServiceArea(
    fireStationPoint: Coordinate
  ): Promise<void> {
    let second: number = 5 * 60;
    let data = await this.httpService.getFromEnd(`/route/generateServiceAreaBySecond?x1=${fireStationPoint[0]}&y1=${fireStationPoint[1]}&srid=3857&serviceTimeInSecond=${second}`);
    let serviceArea: Feature = wktFormat.readFeature(data, {
      dataProjection: 'EPSG:3857',
      featureProjection: 'EPSG:3857'
    });
    this.routeSource.clear();
    this.routeSource.addFeature(serviceArea);
  }

  public removeServiceArea(){
      this.routeSource.clear();
  }

  public getServiceAreaLayer(): VectorLayer{
      return this.routerLayer;
  }

}
