import { Injectable } from '@angular/core';
import { FireThing } from '../FireThing';

@Injectable({
    providedIn: 'root',
})
export class FireThingService{
    private imageList : FireThing[] = [];
    private readonly firePoint: FireThing = new FireThing("火灾点", "./assets/FireImage/火灾点.png", 0);

    constructor(){
        this.imageList.push(new FireThing("消防车", "./assets/FireImage/消防车1.png", 1000000));
        // this.imageList.push(new FireThing("消防车2", "./assets/FireImage/消防车2.png", 1000000));
        this.imageList.push(new FireThing("消防站点", "./assets/FireImage/消防站点.png", 10000000));
    }

    getFireThingByName(name : String) : FireThing{
        var fireThing:FireThing = null;
        for(var i = 0; i < this.imageList.length; i++ ){
            var temp:FireThing = this.imageList[i];;
            if(temp.compareName(name) != null){
                fireThing = temp;
                break;
            }
        }
        return fireThing;
    }

    getFirePoint() : FireThing {
        return this.firePoint;
    }

    getUrlByName(name : String) : String {
        let fireThing = this.getFireThingByName(name);
        return fireThing === null ? "" : fireThing.getUrl();
    }

    getList() : FireThing[] {
        return this.imageList;
    }
}