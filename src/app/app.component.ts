import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';

import {
  defaults as ControlDefaults
} from 'ol/control';

import Geometry from 'ol/geom/Geometry';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import {
  StatusService
} from '../StatusService';

import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';


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

import Overlay from 'ol/Overlay';

import {
  NgZone
} from '@angular/core';
import {
  FireThingService
} from 'src/FireThingService';

import {
  fromLonLat
} from 'ol/proj';

import {
  GameTimeService
} from '../GameTimeService';
import {
  FireService
} from '../FireService';
import {
  FirePoint
} from 'src/Entity/FirePoint';
import {
  SaveFireOuterResult
} from './fireStationInformation/fireStationInformation.component';

import {
  FireThingLayerService
} from '../FireThingLayerService';
import {
  FireThingEnum
} from 'src/FireThingEnum';
// import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
// import { FireStationPopupComponent} from './Popup/FireStationPopup/FireStationPopup.component';
import { Coordinate, Pixel } from '../BasicOpenlayerType';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'FireFightingFront';
  map: Map;
  private statusService: StatusService;
  // private 火灾点矢量源: VectorSource;
  // private 火灾点矢量图层: VectorLayer;

  showingFireStation: FireStation;
  showingFirePoint: FirePoint;

  constructor(
    statusService: StatusService,
    private zone: NgZone,
    private fireThingService: FireThingService,
    private gameTimeService: GameTimeService,
    private fireService: FireService,
    private fireThingLayerService: FireThingLayerService
    // private modalService: NgbModal

  ) {
    this.statusService = statusService;
  }

  scale(factor: number) {
    this.gameTimeService.setGameTimeScale(factor);
  }


  ngAfterViewInit(): void {
    this.map = new Map({
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7'
          }),
          // source: new OSM()
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
    this.map.addLayer(this.fireThingLayerService.getFireThingLayer());

    // 监听singleclick事件
    this.map.on('singleclick', async (event: any) => {
      console.log(event);
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
          this.购置消防车(coordinate, fireThing, fireStation);
        } else if (fireThing.getName() === "消防站点") {
          this.建设消防站点(coordinate, fireThing);
        }
      } else {
        /* 非建设状态 */
        {
          /* 选择消防站点 */
          let fireStation: FireStation = this.fireThingLayerService.getOneFireStationAt(pixel);
          if (!!fireStation) {
            /* 如果附近有多个消防站点，选择最近的一个消防站点 */
            this.showingFireStation = fireStation;
          } else {
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

  async 购置消防车(coordinate: Coordinate, fireThing: FireThing, refFireStation: FireStation) {
    if (!!refFireStation) {
      console.log(refFireStation.getName());
      /* 判断用户还有没有钱买消防车 */
      if (this.statusService.buyFireThing(fireThing)) {
        /* 有钱买 */
        let fireCar: FireCar = new FireCar(UUID.uuid(), "消防车", refFireStation);
        this.fireThingLayerService.add(fireCar, coordinate);

        refFireStation.addFireCar([fireCar]);
        this.showingFireStation = refFireStation;
      } else {
        alert("死穷鬼");
      }
    }
  }

  建设消防站点(coordinate: Coordinate, fireThing: FireThing) {
    /* 创建消防站点类 */

    /* 判断用户还有没有钱买消防车 */
    if (this.statusService.buyFireThing(fireThing)) {

      let fireStation: FireStation = new FireStation("消防站" + UUID.uuid());
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
    console.log("app", event.fireStation, event.selectFireCarNum);
    /* 提示用户选择一个火苗 */
    alert("请单击选择一个火灾点");
    // 监听singleclick事件
    let fn: Function = (fnEvent: any) => {
      let pixel: Pixel = fnEvent.pixel;
      let firePoint: FirePoint = this.fireThingLayerService.getOneFirePointAt(pixel);
      if (!!firePoint) {
        /* add to PathService */
        firePoint.addSaveFirePower(event.fireStation.saveFire(event.selectFireCarNum));
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
