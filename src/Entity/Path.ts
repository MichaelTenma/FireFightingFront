import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import { FireCar } from './FireCar';
import { FireCarScheduleInterface } from './FireCarScheduleInterface';
import Point from 'ol/geom/Point';
export type Coordinate = Array<number>;

export class Route{
    private route: LineString;
    private kmph: number;/* km/h */
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
    private static calDistanceFromRouteBegin(currentGameTime: number, startGameTime: number, kmph: number) : number{
        let deltaGameTime = currentGameTime - startGameTime;
        let deltaGameTimeSecond = deltaGameTime / 1000.0;

        /* distance in meter */
        let distance = Route.kmphTomps(kmph) * deltaGameTimeSecond;
        return distance;
    }

    public getCoordinateAt(currentGameTime: number, startGameTime: number) : Coordinate{
        let distance_meter = Route.calDistanceFromRouteBegin(currentGameTime, startGameTime, this.kmph);
        return this.route.getCoordinateAtM(distance_meter);
    }

    public getSecond(): number{
        return this.route.getLength() / Route.kmphTomps(this.kmph);
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
    
    constructor(
        routes: Feature[], from: FireCarScheduleInterface, to: FireCarScheduleInterface, fireCar: FireCar
    ){
        this.routes = [];
        routes.forEach(e => {
            let geometry: LineString = e.getGeometry();
            let speed: number = e.get("speed");
            let route: Route = new Route(geometry, speed);
            this.routes.push(route);
        });

        this.from = from;
        this.to = to;
        this.fireCar = fireCar;
    }

    /**
     * 计算得到当前fireCar走到哪里，O(n)，但幂等
     * 不要求currentTime的次序
     */
    private getCoordinateAt(currentTime: number): Coordinate{
        // let deltaSecond = (currentTime - this.startTime) / 1000.0;
        let coordinate: Coordinate = null;
        let sumSecond = 0;
        for(let i = 0;i < this.routes.length;i++){
            let route: Route = this.routes[i];
            coordinate = route.getCoordinateAt(currentTime, this.startTime + sumSecond + 1000);
            if(!!coordinate){
                break;
            }
            sumSecond += route.getSecond();
        }
        return coordinate;
    }

    /**
     * 计算得到当前fireCar走到哪里，<= o(n)最好时o(1) ~ o(2)，非幂等
     * 要求currentTime必须从小到大调用
     */
    private getCurrentCoordiate(currentTime: number): Coordinate{
        let coordinate: Coordinate = null;
        let sumSecond = 0;
        for(let i = this.currentRouteIndex;i < this.routes.length;i++){
            let route: Route = this.routes[i];
            coordinate = route.getCoordinateAt(currentTime, this.currentRouteStartTime);
            if(!!coordinate){
                /* 当前这条路还没走完，继续走就行 */
                break;
            }

            /* 这条路走完了，可以走下一条路了 */
            sumSecond += route.getSecond();
            this.currentRouteIndex ++;
            this.currentRouteStartTime += sumSecond;
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
    
}