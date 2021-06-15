import {
  Injectable
} from '@angular/core';
import {
  HttpService
} from './HttpService';
import { FireThingEnum } from '../FireThingEnum';
import { Coordinate } from '../BasicOpenlayerType';
import { UUID } from '../UUID';
@Injectable({
  providedIn: 'root',
})
export class NameService {
    private readonly ak: string = "3d3b826b3a1802a3cd5129bd51da0255";
    constructor(
        private httpService: HttpService
    ){}

    public async name(coordinate: Coordinate, fireThingEnum: FireThingEnum): Promise<string>{
        let pointName = "";
        if(fireThingEnum === FireThingEnum.FireCar){
            pointName = fireThingEnum + UUID.subUUID(6);
        }else{
            let lon: number = coordinate[0];
            let lat: number = coordinate[1];
            let res = await this.httpService.get(
                `http://api.map.baidu.com/reverse_geocoding/v3/?ak=${this.ak}&output=json` + 
                `&coordtype=wgs84ll&location=${lat},${lon}`
            );
            // console.log({res});
            let addressComponent = res.result.addressComponent;
            let district = addressComponent.district;
            let street = addressComponent.street;
            pointName = district + street + fireThingEnum;
        }
        return pointName;
    }
}
