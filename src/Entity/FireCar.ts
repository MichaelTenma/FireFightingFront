import { FireStation } from './FireStation';

export class FireCar{
    private readonly id: String;
    private name: String;
    private refFireStation: FireStation;

    constructor(
        id: String, name: String, refFireStation: FireStation
    ){
        this.id = id;
        this.name = name;
        this.refFireStation = refFireStation;
    }

    public getId() : String{
        return this.id;
    }

    public getName() : String{
        return this.name;
    }

    public setRefFireStation(refFireStation : FireStation){
        this.refFireStation = refFireStation;
    }

    public getRefFireStation() : FireStation{
        return this.refFireStation;
    }

}