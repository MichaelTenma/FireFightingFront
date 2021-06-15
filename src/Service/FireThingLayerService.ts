import {
  Injectable
} from '@angular/core';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import {
  Icon,
  Style,
} from 'ol/style';
import {
  FireCar
} from '../Entity/FireCar';
import {
  FireStation
} from '../Entity/FireStation';
import {
  FirePoint
} from '../Entity/FirePoint';
import Point from 'ol/geom/Point';
import {
  FireThingEnum
} from '../FireThingEnum';
import Map from 'ol/Map';
import {
  Coordinate,
  Pixel
} from '../BasicOpenlayerType';

@Injectable({
  providedIn: 'root',
})
export class FireThingLayerService {
  private fireThingSource: VectorSource;
  private fireThingLayer: VectorLayer;

  /* readonly */
  private map: Map;

  constructor() {
    this.fireThingSource = new VectorSource();
    this.fireThingLayer = new VectorLayer({
      source: this.fireThingSource,
      style: FireThingLayerService.getFeatureStyle
    });
  }

  private static getFeatureStyle(feature: Feature): Style {
    if (feature.get("visibility") === false) return null;
    return FireThingLayerService.defaultStyle(feature.get("type"));
  }

  public static defaultStyle(type: FireThingEnum): Style[] {
    let styles: Style[] = [];
    styles[FireThingEnum.FireCar] = new Style({
      image: new Icon({
        src: "./assets/FireImage/消防车1.png",
        scale: 0.4
      })
    });
    styles[FireThingEnum.FireStation] = new Style({
      image: new Icon({
        src: "./assets/FireImage/消防站点.png",
        scale: 0.3
      })
    });
    styles[FireThingEnum.FirePoint] = new Style({
      image: new Icon({
        src: "./assets/FireImage/火灾点.png",
        scale: 0.5
      })
    });
    return styles[type];
  }

  public static getType(fireThing: FireCar | FireStation | FirePoint): FireThingEnum {
    let type: FireThingEnum;
    if (fireThing instanceof FireCar) {
      /* 消防车默认情况下是不可见的，因为一开始就被加到某一消防站中 */
      type = FireThingEnum.FireCar;
    } else if (fireThing instanceof FireStation) {
      type = FireThingEnum.FireStation;
    } else if (fireThing instanceof FirePoint) {
      type = FireThingEnum.FirePoint;
    } else {
      type = null;
    }
    return type;
  }

  public setMap(map: Map) {
    this.map = map;
  }

  public add(data: FireCar | FireStation | FirePoint, coordinate: Coordinate): Feature {
    let point: Point = new Point(coordinate);
    let type: FireThingEnum = FireThingLayerService.getType(data);

    let visibility: boolean = true;
    if (type === FireThingEnum.FireCar) {
      /* 消防车默认情况下是不可见的，因为一开始就被加到某一消防站中 */
      visibility = false;
    }
    let feature: Feature;
    if (!!type) {
      feature = new Feature(point);
      feature.set("type", type);
      feature.set("data", data);
      feature.set("visibility", visibility);

      this.fireThingSource.addFeature(feature);
    }
    return feature;
  }

  private getAllFeature(type: FireThingEnum): Feature[] {
    let allFeatures: Feature[] = this.fireThingSource.getFeatures();
    return allFeatures.filter(feature => feature.get('type') === type);
  }

  public getAllFeatureAt(type: FireThingEnum, pixel: Pixel): Feature[] {
    const features: Feature[] = this.map.getFeaturesAtPixel(pixel, {
      layerFilter: (layer: any) => layer === this.fireThingLayer
    })
    let resArray: Feature[] = [];
    features.forEach((feature: Feature) => {
      let featureType: FireThingEnum = feature.get('type');
      if (featureType === type) {
        resArray.push(feature);
      }
    });
    return resArray;
  }

  public getAllFireCarAt(pixel: Pixel): FireCar[] {
    return <FireCar[] > this.getAllAt(FireThingEnum.FireCar, pixel);
  }
  public getAllFireStationAt(pixel: Pixel): FireStation[] {
    return <FireStation[] > this.getAllAt(FireThingEnum.FireStation, pixel);
  }
  public getAllFirePointAt(pixel: Pixel): FirePoint[] {
    return <FirePoint[] > this.getAllAt(FireThingEnum.FirePoint, pixel);
  }
  private getAllAt(type: FireThingEnum, pixel: Pixel): FireCar[] | FireStation[] | FirePoint[] {
    const features: Feature[] = this.getAllFeatureAt(type, pixel);
    let resArray: FireCar[] | FireStation[] | FirePoint[] = [];
    features.forEach((feature: Feature) => {
      resArray.push(feature.get("data"));
    });
    return resArray;
  }

  public getOneFireCarAt(pixel: Pixel): FireCar {
    return <FireCar > this.getOneAt(FireThingEnum.FireCar, pixel);
  }
  public getOneFireStationAt(pixel: Pixel): FireStation {
    return <FireStation > this.getOneAt(FireThingEnum.FireStation, pixel);
  }
  public getOneFirePointAt(pixel: Pixel): FirePoint {
    return <FirePoint > this.getOneAt(FireThingEnum.FirePoint, pixel);
  }
  private getOneAt(type: FireThingEnum, pixel: Pixel): FireCar | FireStation | FirePoint {
    const fireThingArray: FireCar[] | FireStation[] | FirePoint[] = this.getAllAt(type, pixel);
    let res: FireCar | FireStation | FirePoint;
    if (fireThingArray.length > 0) {
      res = fireThingArray[0];
    }
    return res;
  }

  public removeAllAt(type: FireThingEnum, pixel: Pixel) {
    let features: Feature[] = this.getAllFeatureAt(type, pixel);
    features.forEach(feature => {
      this.fireThingSource.removeFeature(feature);
    });
  }

  public removeFeature(feature: Feature) {
    this.fireThingSource.removeFeature(feature);
  }

  public setVisibility(fireThing: FireCar | FirePoint | FireStation | Feature, visibility: boolean) {
    let feature:Feature = fireThing;
    if(!(fireThing instanceof Feature)){
      feature = this.getFeatureBy(fireThing);
    }
    // console.log(feature, !!feature, "尝试修改", visibility)
    if(!!feature){
      feature.set('visibility', visibility);
    }
  }

  public getFeatureBy(fireThing: FireCar | FirePoint | FireStation) : Feature{
    let resFeature: Feature;
    let features: Feature[] = this.getAllFeature(FireThingLayerService.getType(fireThing));
    for(let i = 0;i < features.length;i++){
      if(fireThing === FireThingLayerService.getDataFromFeature(features[i])){
        resFeature = features[i];
        break;
      }
    }
    return resFeature;
  }


  public getFireThingLayer(): VectorLayer {
    return this.fireThingLayer;
  }

  public static getDataFromFeature(feature: Feature): FireCar | FirePoint | FireStation {
    return feature.get('data');
  }

  // public renderMap(){
  //   this.map.render();
  // }
}
