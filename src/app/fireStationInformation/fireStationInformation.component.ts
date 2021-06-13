import {
  Component,
  OnInit,DoCheck,
  Input,Output, EventEmitter
} from '@angular/core';
import { FireCar } from 'src/Entity/FireCar';
import {
  FireStation
} from '../../Entity/FireStation';
import {
  FireThing
} from '../../FireThing';
import {
  FireThingService
} from '../../Service/FireThingService';


export class SaveFireOuterResult{
  public readonly fireStation: FireStation;
  public readonly selectFireCarNum: number;
  constructor(fireStation: FireStation, selectFireCarNum: number){
    this.fireStation = fireStation;
    this.selectFireCarNum = selectFireCarNum;
  }
}

@Component({
  selector: 'app-firestation-information',
  templateUrl: './fireStationInformation.component.html',
  styleUrls: ['./fireStationInformation.component.css']
})
export class FireStationInformationComponent implements OnInit,DoCheck {
  @Input() fireStation: FireStation;
  @Output() private saveFireOuter = new EventEmitter<SaveFireOuterResult>()
  
  fireThing: FireThing;

  value: number = 0;
  max: number;

  constructor(
    fireThingService: FireThingService,
  ) {
    this.fireThing = fireThingService.getFireThingByName("消防车");
  }

  ngDoCheck(): void {
    if (this.max !== this.fireStation.getNumOfFireCar()) {
      this.max = this.fireStation.getNumOfFireCar();
    }
  }

  ngOnInit(): void {}

  saveFire() {
    /* 选择消防车 */
    this.saveFireOuter.emit(new SaveFireOuterResult(this.fireStation, this.value));
    // let selectFireCar: FireCar[] = this.fireStation.saveFire(this.value);
    /* select a fire */
    // console.log("saveFire", selectFireCar);
  }
}
