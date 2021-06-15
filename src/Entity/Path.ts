import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import { FireCar } from './FireCar';
import { FireCarScheduleInterface } from './FireCarScheduleInterface';
import { Coordinate } from '../BasicOpenlayerType';
import VectorSource from 'ol/source/Vector';
import { FireThingEnum } from 'src/FireThingEnum';
import { FireThingLayerService } from 'src/Service/FireThingLayerService';
import { FireStation } from './FireStation';
import { FirePoint } from './FirePoint';
export class Route{
    private readonly route: LineString;
    private readonly kmph: number;/* km/h */
    constructor(route: LineString, kmph: number){
        this.route = route;
        this.kmph = kmph;
    }

    /**
     * transform km/h to m/s
     */
    private static kmphTomps(kmph: number): number{
        return kmph / 3.6;
    }

    /**
     * cal distance in meter
     */
    private static calFactorFromRouteBegin(currentGameTime: number, startGameTime: number, kmph: number, routeMeter: number) : number{
        let deltaGameTime = currentGameTime - startGameTime;
        let deltaGameTimeSecond = deltaGameTime / 1000.0;

        /* distance in meter */
        let distance = Route.kmphTomps(kmph) * deltaGameTimeSecond;
        let factor = distance / routeMeter;
        if(factor < 0) factor = 0;
        return factor;
    }

    public getCoordinateAt(currentGameTime: number, startGameTime: number) : Coordinate{
        let factor = Route.calFactorFromRouteBegin(currentGameTime, startGameTime, this.kmph, this.route.getLength());
        return factor < 1 ? this.route.getCoordinateAt(factor) : null;
    }

    public getSecond(): number{
        return this.route.getLength() / Route.kmphTomps(this.kmph);
    }

    public getRoute(): LineString{
        return this.route;
    }
}

export class Path{
    private routes: Route[];
    private from: FireCarScheduleInterface;
    private to: FireCarScheduleInterface;
    private fireCar: FireCar;

    private startTime: number;
    private currentRouteIndex: number;
    private currentRouteStartTime: number;
    private features: Feature[];
    private readonly vectorSource: VectorSource;
    
    constructor(
        routes: Route[], from: FireCarScheduleInterface, to: FireCarScheduleInterface, fireCar: FireCar, vectorSource
    ){
        this.routes = routes;

        this.from = from;
        this.to = to;
        this.fireCar = fireCar;

        this.vectorSource = vectorSource;
    }
    /**
     * 向目的地添加消防车
     */
    inFireCar(): void {
        this.to.inFireCars([this.fireCar]);
    }

    /**
     * 向出发地减少消防车
     */
    outFireCar(): void {
        this.from.outFireCars([this.fireCar]);
    }

    public displayPath(){
        let features: Feature[] = [];
        this.routes.forEach(e => {
            let feature: Feature = new Feature({
                geometry: e.getRoute()
            });
            this.vectorSource.addFeature(feature);
            features.push(feature);
        });
        this.features = features;
    }

    public removePath(){
        this.features.forEach(e => {
            this.vectorSource.removeFeature(e);
        });
        this.features = [];
    }

    public static transformFeaturesToRoutes(
        features: Feature[]
    ): Route[]{
        let routes: Route[] = [];
        features.forEach((e: Feature) => {
            let geometry: LineString = e.getGeometry();
            let speed: number = e.get("speed");
            let route: Route = new Route(geometry, speed);
            routes.push(route);
        });
        return routes;
    }

    /**
     * 计算得到当前fireCar走到哪里，O(n)，但幂等
     * 不要求currentTime的次序
     */
    public getCoordinateAt(currentTime: number): Coordinate{
        let resCoordinate: Coordinate = null;

        let tempCoordinate: Coordinate = null;
        let sumSecond = 0;
        for(let i = 0;i < this.routes.length;i++){
            let route: Route = this.routes[i];
            tempCoordinate = route.getCoordinateAt(currentTime, this.startTime + sumSecond * 1000);
            if(!!tempCoordinate){
                resCoordinate = tempCoordinate;
                break;
            }
            sumSecond += route.getSecond();
        }
        return resCoordinate;
    }

    /**
     * 计算得到当前fireCar走到哪里，<= o(n)最好时o(1) ~ o(2)，非幂等
     * 要求currentTime必须从小到大调用
     */
    public getCurrentCoordiate(currentTime: number): Coordinate{
        let coordinate: Coordinate = null;
        for(let i = this.currentRouteIndex;i < this.routes.length;i++){
            let route: Route = this.routes[i];
            coordinate = route.getCoordinateAt(currentTime, this.currentRouteStartTime);
            if(!!coordinate){
                /* 当前这条路还没走完，继续走就行 */
                break;
            }
            /* 这条路走完了，可以走下一条路了 */
            this.currentRouteIndex = i + 1;
            this.currentRouteStartTime += route.getSecond() * 1000;
        }
        return coordinate;
    }

    /**
     * start the path
     */
    public start(startTime: number){
        this.startTime = startTime;
        this.currentRouteStartTime = this.startTime;
        this.currentRouteIndex = 0;
    }

    /**
     * end the path
     */
    private stop(){
        this.currentRouteIndex = 0;
    }
    
    public getFireCar() : FireCar {
        return this.fireCar;
    }

    public getTotalRunSecond(currentTime: Date): number{
        return (currentTime.getTime() - this.startTime) / 1000.0;
    }

    public isToType(): FireThingEnum{
        let fireThing = this.to;
        
        let type: FireThingEnum;
        if (fireThing instanceof FireCar) {
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
}