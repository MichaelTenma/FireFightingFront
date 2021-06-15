import {
  Injectable
} from '@angular/core';
import {
  FireThing
} from '../FireThing';

import { GameTimeService } from './GameTimeService';

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private constructFireThing: FireThing;
  private userMoney: number; /* 用户剩余的资金 */

  constructor(
    private gameTimeService: GameTimeService
  ) {
    this.constructFireThing = null;
    this.userMoney = 5000 * 10000; /* 五千万元人民币 */
  }

  public getGameTime(): Date {
    return this.gameTimeService.getGameTime();
  }

  public beginConstruct(constructFireThing: FireThing) {
    this.constructFireThing = constructFireThing;
  }

  public endConstruct() {
    this.constructFireThing = null;
  }

  public getConstructFireThing(): FireThing {
    return this.constructFireThing;
  }

  private modifyUserMoney(deltaMoney: number) {
    this.userMoney += deltaMoney;
  }
  private addUserMoney(deltaMoney: number) {
    this.modifyUserMoney(Math.abs(deltaMoney));
  }
  private minusUserMoney(deltaMoney: number) {
    this.modifyUserMoney(-Math.abs(deltaMoney))
  }

  public buyFireThing(fireThing: FireThing): boolean {
    let res: boolean = this.userMoney >= fireThing.getMoney();
    if(res){
        this.minusUserMoney(fireThing.getMoney());
    }
    return res;
  }

  public getUserMoney(): number {
    return this.userMoney;
  }

  public saveAFire(fireTimeSecond: number){
    /* 100000cos(ln((x+900)/900)) */
    let bonus = 100 * 10000 * Math.cos( Math.log( (fireTimeSecond + 900) / 900 ) );
    this.modifyUserMoney(bonus);
  }
}
