import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import {
  Icon,
  Style,
} from 'ol/style';
import {
  FireCar
} from './Entity/FireCar';
import {
  FireStation
} from './Entity/FireStation';
import {
  FirePoint
} from './Entity/FirePoint';
import {
  UUID
} from './UUID';
import Point from 'ol/geom/Point';
import {
  FireThingEnum
} from './FireThingEnum';

type Coordinate = Array < number > ;

export class FireThingLayerService {
  private fireThingSource: VectorSource;
  private fireThingLayer: VectorLayer;

  constructor(

  ) {
    this.fireThingSource = new VectorSource({
      style: FireThingLayerService.getFeatureStyle
    });
    this.fireThingLayer = new VectorLayer({
      source: this.fireThingSource
    });
  }

  private static getFeatureStyle(feature: Feature): Style {
    if (feature.get("visibility") == false) return null;
    const styles = FireThingLayerService.defaultStyle();
    return styles[feature.get("type")];
  }

  private static defaultStyle(): Style[] {
    let styles: Style[] = [];
    styles[FireThingEnum.FireCar] = new Style({
      image: new Icon({
        src: "./assets/FireImage/消防车1.png",
        scale: 0.4
      })
    });
    styles[FireThingEnum.FireCar] = new Style({
      image: new Icon({
        src: "./assets/FireImage/消防站点.png",
        scale: 0.3
      })
    });
    styles[FireThingEnum.FireCar] = new Style({
      image: new Icon({
        src: "./assets/FireImage/火灾点.png",
        scale: 0.5
      })
    });
    return styles;
  }

  private getType(fireaThing: FireCar | FireStation | FirePoint): FireThingEnum {
    let type: FireThingEnum;
    if (typeof fireaThing === typeof FireCar) {
      /* 消防车默认情况下是不可见的，因为一开始就被加到某一消防站中 */
      type = FireThingEnum.FireCar;
    } else if (typeof fireaThing === typeof FireStation) {
      type = FireThingEnum.FireStation;
    } else if (typeof fireaThing === typeof FirePoint) {
      type = FireThingEnum.FirePoint;
    }else{
        type = null;
    }
    return type;
  }

  public add(data: FireCar | FireStation | FirePoint, coordinate: Coordinate): Feature {
    let point: Point = new Point(coordinate);
    let type: FireThingEnum = this.getType(data);

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

  public getAllFeatureAt(type: FireThingEnum, coordinate: Coordinate): Feature[] {
    const features: Feature[] = this.fireThingSource.getFeaturesAtCoordinate(coordinate);
    let resArray: Feature[] = [];
    features.forEach((feature: Feature) => {
      let featureType: FireThingEnum = feature.get('type');
      if (featureType === type) {
        resArray.push(feature);
      }
    });
    return resArray;
  }

  public getAllAt(type: FireThingEnum, coordinate: Coordinate): FireCar[] | FireStation[] | FirePoint[] {
    const features: Feature[] = this.getAllFeatureAt(type, coordinate);
    let resArray: FireCar[] | FireStation[] | FirePoint[] = [];
    features.forEach((feature: Feature) => {
      resArray.push(feature.get("data"));
    });
    return resArray;
  }

  public getOneAt(type: FireThingEnum, coordinate: Coordinate): FireCar | FireStation | FirePoint {
    const fireThingArray: FireCar[] | FireStation[] | FirePoint[] = this.getAllAt(type, coordinate);
    let res: FireCar | FireStation | FirePoint;
    if (fireThingArray.length > 0) {
      res = fireThingArray[0];
    }
    return res;
  }

  public removeAllAt(type: FireThingEnum, coordinate: Coordinate) {
    let features: Feature[] = this.getAllFeatureAt(type, coordinate);
    features.forEach(feature => {
      this.fireThingSource.removeFeature(feature);
    });
  }

  public setVisibility(fireThing: FireCar | FirePoint | FireStation, visibility: boolean) {
    const type: FireThingEnum = this.getType(fireThing);
    if(!!type){
        let features: Feature[] = this.getAllFeature(type);
        features.forEach(feature => {
          feature.set('visibility', visibility);
        });
    }
  }
}
