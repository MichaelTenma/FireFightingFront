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

// import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
// import { FireStationPopupComponent} from './Popup/FireStationPopup/FireStationPopup.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'FireFightingFront';
  map: Map;
  private statusService: StatusService;
  private 火灾点矢量源: VectorSource;
  private 火灾点矢量图层: VectorLayer;

  showingFireStation: FireStation;
  showingFirePoint: FirePoint;

  constructor(
    statusService: StatusService,
    private zone: NgZone,
    private fireThingService: FireThingService,
    private gameTimeService: GameTimeService,
    private fireService: FireService
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
        }),
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

    let 消防车矢量源: VectorSource = new VectorSource();
    let 消防站点矢量源: VectorSource = new VectorSource();
    let 火灾点矢量源: VectorSource = new VectorSource();
    this.火灾点矢量源 = 火灾点矢量源;

    let 消防车矢量图层: VectorLayer = new VectorLayer({
      source: 消防车矢量源
    });
    let 消防站点矢量图层: VectorLayer = new VectorLayer({
      source: 消防站点矢量源
    });
    let 火灾点矢量图层: VectorLayer = new VectorLayer({
      source: 火灾点矢量源,
      style: this.fireThingService.getFirePoint().getStyle()
    });
    this.火灾点矢量图层 = 火灾点矢量图层;

    this.map.addLayer(消防站点矢量图层);
    this.map.addLayer(火灾点矢量图层);
    this.map.addLayer(消防车矢量图层);

    // 监听singleclick事件
    this.map.on('singleclick', async (event: any) => {
      /* 正在为出警选择火灾点 */
      if (this.selectTargetFirePointForSaveFire) return;

      let pixel = this.map.getEventPixel(event.originalEvent);

      let fireThing: FireThing = this.statusService.getConstructFireThing();
      if (fireThing != null) {
        // console.log(fireThing.getName());
        if (fireThing.getName() === "消防车") {
          this.购置消防车(event.coordinate, fireThing, 消防车矢量源, 消防站点矢量图层, pixel);
        } else if (fireThing.getName() === "消防站点") {
          this.建设消防站点(event.coordinate, fireThing, 消防站点矢量源);
        }
      } else {
        /* 非建设状态 */
        /* 搜寻点击点附近有没有消防站点，如果没有消防站点则提示请在一个消防站点附近添加消防车 */

        /* 选择消防站点 */
        this.getIntersectFeatureAtPixel(消防站点矢量图层, pixel).then((fireStationFeatureList: Feature[]) => {
          if (fireStationFeatureList.length > 0) {
            /* 如果附近有多个消防站点，选择最近的一个消防站点 */
            let geometry: Geometry = fireStationFeatureList[0].getGeometry();
            let geometryExtent: number[] = geometry.getExtent();
            // let coordinate = [geometryExtent[0], geometryExtent[1]];

            let fireStation: FireStation = fireStationFeatureList[0].get("data");
            // this.open(fireStation);
            this.showingFireStation = fireStation;
            // console.log(fireStation);
          } else {
            this.showingFireStation = null;
          }
        });

        this.getIntersectFeatureAtPixel(火灾点矢量图层, pixel).then((firePointFeatureList: Feature[]) => {
          console.log("hhhh");
          if (firePointFeatureList.length > 0) {
            //   /* 如果附近有多个消防站点，选择最近的一个消防站点 */
            let geometry: Geometry = firePointFeatureList[0].getGeometry();
            let geometryExtent: number[] = geometry.getExtent();
            // let coordinate = [geometryExtent[0], geometryExtent[1]];

            let firePoint: FirePoint = firePointFeatureList[0].get("data");
            //   // this.open(fireStation);
            this.showingFirePoint = firePoint;
            //   // console.log(fireStation);
          } else {
            this.showingFirePoint = null;
          }
        });

      }
    })
    this.fire();
  }

  async getIntersectFeatureAtPixel(targetLayer: any, pixel: any): Promise < Feature[] > {
    let featureList: Feature[] = await (new Promise < Feature[] > ((resolve, reject) => {
      let list: Feature = [];
      this.map.forEachFeatureAtPixel(pixel, function (feature: Feature, layer: any) {
        if (feature != undefined && (targetLayer === null || targetLayer === layer)) {
          list.push(feature);
        }
      });
      resolve(list);
    }));
    return featureList;
  }

  async 购置消防车(coordinate: number[], fireThing: FireThing, 消防车矢量源: VectorSource, 消防站点矢量图层: VectorLayer, pixel: any) {
    let point: Point = new Point(coordinate);

    /* 搜寻点击点附近有没有消防站点，如果没有消防站点则提示请在一个消防站点附近添加消防车 */
    let featureList: Feature[] = await this.getIntersectFeatureAtPixel(消防站点矢量图层, pixel);

    if (featureList.length > 0) {
      /* 如果附近有多个消防站点，选择最近的一个消防站点 */
      let nearestFeature: Feature = featureList[0];
      let fireStation: FireStation = nearestFeature.get("data");
      console.log(fireStation.getName());

      /* 判断用户还有没有钱买消防车 */
      if (this.statusService.buyFireThing(fireThing)) {
        /* 有钱买 */
        let fireCar: FireCar = new FireCar(UUID.uuid(), "消防车", fireStation);
        fireStation.addFireCar([fireCar]);
        this.showingFireStation = fireStation;

        // let feature: Feature = new Feature(point);
        // feature.set("data", fireThing);
        // feature.setStyle(fireThing.getStyle());

        // 消防车矢量源.addFeature(feature);

        // console.log(fireStation);
      } else {
        alert("死穷鬼");
      }
    }
  }

  建设消防站点(coordinate: number[], fireThing: FireThing, vectorSource: VectorSource) {
    /* 创建消防站点类 */

    /* 判断用户还有没有钱买消防车 */
    if (this.statusService.buyFireThing(fireThing)) {

      let fireStation: FireStation = new FireStation("消防站" + UUID.uuid());
      let point: Point = new Point(coordinate);
      let feature: Feature = new Feature(point);

      feature.set("data", fireStation);
      feature.setStyle(fireThing.getStyle());

      vectorSource.addFeature(feature);

      this.showingFireStation = fireStation;

      // console.log(feature.get("data").getName());
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

    this.gameTimeService.registerTaskByTask(this.fireService.randomFire(this.火灾点矢量源));

    this.fireService.updateFirePoint(this.火灾点矢量源, (doneFirePoint: FirePoint) => {
      if (doneFirePoint === this.showingFirePoint) {
        this.showingFirePoint = null;
      }
    });
  }

  // open(fireStation: FireStation){
  //   // const modalRef: NgbModalRef = this.modalService.open(FireStationPopupComponent);
  //   // modalRef.componentInstance.fireStation = fireStation;
  // }

  private selectTargetFirePointForSaveFire: boolean = false;
  saveFire(event: SaveFireOuterResult) {
    console.log("app", event.fireStation, event.selectFireCarNum);
    /* 提示用户选择一个火苗 */
    alert("请单击选择一个火灾点");
    // 监听singleclick事件
    let fn: Function = (fnEvent: any) => {
      let pixel = this.map.getEventPixel(fnEvent.originalEvent);
      this.getIntersectFeatureAtPixel(this.火灾点矢量图层, pixel).then((firePointFeatureList: Feature[]) => {
        if (firePointFeatureList.length > 0) {
          //   /* 如果附近有多个消防站点，选择最近的一个消防站点 */
          let geometry: Geometry = firePointFeatureList[0].getGeometry();
          let firePoint: FirePoint = firePointFeatureList[0].get("data");
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
      });
    }
    this.selectTargetFirePointForSaveFire = true;
    this.map.on('singleclick', fn);

  }
}
