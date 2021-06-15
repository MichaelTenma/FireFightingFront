import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';

import {
  defaults as ControlDefaults
} from 'ol/control';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import {
  StatusService
} from '../Service/StatusService';

import {
  FireThing
} from '../FireThing';

import {
  FireCar
} from '../Entity/FireCar';

import {
  UUID
} from '../UUID';
import {
  FireStation
} from 'src/Entity/FireStation';
import {
  GameTimeService
} from '../Service/GameTimeService';
import {
  FireService
} from '../Service/FireService';
import {
  FirePoint
} from 'src/Entity/FirePoint';
import {
  SaveFireOuterResult
} from './fireStationInformation/fireStationInformation.component';

import {
  FireThingLayerService
} from '../Service/FireThingLayerService';

import { Coordinate, Pixel } from '../BasicOpenlayerType';
import { PathService } from '../Service/PathService';
import { ServiceAreaService } from '../Service/ServiceAreaService';
import { NameService } from '../Service/NameService';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { transform as proj_transform, get as proj_get, fromLonLat } from 'ol/proj';
import { FireThingEnum } from 'src/FireThingEnum';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'FireFightingFront';
  map: Map;
  showingFireStation: FireStation;
  showingFirePoint: FirePoint;

  constructor(
    private gameTimeService: GameTimeService,
    private fireService: FireService,
    private fireThingLayerService: FireThingLayerService,
    private statusService: StatusService,
    private pathService: PathService,
    private serviceAreaService: ServiceAreaService,
    private nameService: NameService
  ) {}

  ngAfterViewInit(): void {
    this.map = new Map({
      view: new View({
        center: fromLonLat([113.280637, 23.125178]),
        zoom: 12,
      }),
      layers: [
        new TileLayer({
          // source: new XYZ({
          //   url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7'
          // }),
          source: new OSM()
        })
      ],
      controls: ControlDefaults({
        zoom: false,
        rotate: false,
        attribution: false
      }),
      target: 'ol-map'
    });
    
    this.init();
  }

  async init() {
    this.fireThingLayerService.setMap(this.map);
    /* 没有进行深克隆 */
    this.map.addLayer(this.serviceAreaService.getServiceAreaLayer());
    this.map.addLayer(this.pathService.getRouterLayer());
    this.map.addLayer(this.fireThingLayerService.getFireThingLayer());

    // 监听singleclick事件
    this.map.on('singleclick', async (event: any) => {
      let pixel: Pixel = event.pixel;
      let coordinate: Coordinate = event.coordinate;
      /* 正在为出警选择火灾点 */
      if (this.selectTargetFirePointForSaveFire) return;

      // let pixel = this.map.getEventPixel(event.originalEvent);

      let fireThing: FireThing = this.statusService.getConstructFireThing();
      if (fireThing != null) {
        // console.log(fireThing.getName());
        if (fireThing.getName() === "消防车") {
          /* 搜寻点击点附近有没有消防站点，如果没有消防站点则提示请在一个消防站点附近添加消防车 */
          /* 如果附近有多个消防站点，选择最近的一个消防站点 */
          let fireStation: FireStation = this.fireThingLayerService.getOneFireStationAt(pixel);
          this.购置消防车(fireThing, fireStation);
        } else if (fireThing.getName() === "消防站点") {
          this.serviceAreaService.calServiceArea(coordinate);
          this.建设消防站点(coordinate, fireThing);
        }
      } else {
        /* 非建设状态 */
        {
          /* 选择消防站点 */
          let fireStation: FireStation = this.fireThingLayerService.getOneFireStationAt(pixel);
          if (!!fireStation) {
            /* 如果附近有多个消防站点，选择最近的一个消防站点 */
            /* 展示该站点的服务区 */
            this.serviceAreaService.calServiceArea(coordinate);
            this.showingFireStation = fireStation;
          } else {
            this.serviceAreaService.removeServiceArea();
            this.showingFireStation = null;
          }
        } {
          /* 选择火灾点 */
          let firePoint: FirePoint = this.fireThingLayerService.getOneFirePointAt(pixel);
          if (!!firePoint) {
            /* 如果附近有多个火灾点，选择最近的一个火灾点 */
            this.showingFirePoint = firePoint;
          } else {
            this.showingFirePoint = null;
          }
        }
      }
    })
    this.fire();
  }

  async 购置消防车(fireThing: FireThing, refFireStation: FireStation) {
    if (!!refFireStation) {
      // console.log(refFireStation.getName());
      /* 判断用户还有没有钱买消防车 */
      if (this.statusService.buyFireThing(fireThing)) {
        /* 有钱买 */
        let coordinate: Coordinate = this.fireThingLayerService.getFeatureBy(refFireStation).getGeometry().getFirstCoordinate();
        let name: string = await this.nameService.name(proj_transform(coordinate, "EPSG:3857", "EPSG:4326"), FireThingEnum.FireCar);

        let fireCar: FireCar = new FireCar(UUID.uuid(), name, refFireStation);
        this.fireThingLayerService.add(fireCar, coordinate);

        refFireStation.addFireCar([fireCar]);
        this.showingFireStation = refFireStation;
      } else {
        alert("死穷鬼");
      }
    }
  }

  async 建设消防站点(coordinate: Coordinate, fireThing: FireThing) {
    /* 创建消防站点类 */

    /* 判断用户还有没有钱买消防车 */
    if (this.statusService.buyFireThing(fireThing)) {

      let name: string = await this.nameService.name(proj_transform(coordinate, "EPSG:3857", "EPSG:4326"), FireThingEnum.FireStation);
      let fireStation: FireStation = new FireStation(name);
      this.fireThingLayerService.add(fireStation, coordinate);

      this.showingFireStation = fireStation;
    } else {
      alert("死穷鬼");
    }
  }


  fire() {
    // this.gameTimeService.registerTask(
    //   () => {
    //     this.fireService.randomFire(this.火灾点矢量源)
    //   },500, true /* 等于false的时候会出现问题，任务被终止了就没有重新启动，应该是restRunTime被减去了1 */
    // );

    this.gameTimeService.registerTaskByTask(this.fireService.randomFire());

    this.fireService.updateFirePoint((doneFirePoint: FirePoint) => {
      if (doneFirePoint === this.showingFirePoint) {
        this.showingFirePoint = null;
      }
    });
  }

  private selectTargetFirePointForSaveFire: boolean = false;
  saveFire(event: SaveFireOuterResult) {
    let startFeature: Feature = this.fireThingLayerService.getFeatureBy(event.fireStation);
    let startPoint: Coordinate = startFeature.getGeometry().getFirstCoordinate();

    /* 提示用户选择一个火苗 */
    alert("请单击选择一个火灾点");
    // 监听singleclick事件
    let fn: Function = async (fnEvent: any) => {
      // let endPoint = fnEvent.coordinate;
      /* 3857 */
      let pixel: Pixel = fnEvent.pixel;
      let firePoint: FirePoint = this.fireThingLayerService.getOneFirePointAt(pixel);
      let firePointFeature: Feature = this.fireThingLayerService.getFeatureBy(firePoint);
      let endPoint: Coordinate = firePointFeature.getGeometry().getFirstCoordinate();
      if (!!firePoint) {
        /* add to PathService */
        let fireCars: FireCar[] = event.fireStation.saveFire(event.selectFireCarNum);
        // console.log({fireCars});
        this.pathService.registerPath(await this.pathService.requestPath(
          startPoint, endPoint, event.fireStation, firePoint, fireCars
        ));
        
        // firePoint.addSaveFirePower(fireCars);
        this.showingFirePoint = firePoint;
        alert("消防车已经出发");
      } else {
        this.showingFirePoint = null;
        alert("此处没有火灾点");
      }
      this.map.un('singleclick', fn);
      this.selectTargetFirePointForSaveFire = false;
    }
    this.selectTargetFirePointForSaveFire = true;
    this.map.on('singleclick', fn);
  }
}
