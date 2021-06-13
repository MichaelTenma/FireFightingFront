import { Component, OnInit, Input } from '@angular/core';
import { FirePoint } from '../../Entity/FirePoint';
import { FireThing } from '../../FireThing';
import { FireThingService } from '../../FireThingService';

@Component({
  selector: 'app-fire-point-information',
  templateUrl: './fire-point-information.component.html',
  styleUrls: ['./fire-point-information.component.css']
})
export class FirePointInformationComponent implements OnInit {

  @Input() firePoint: FirePoint;

  fireThing: FireThing;

  constructor(
    private fireThingService: FireThingService,
  ) {
    this.fireThing = fireThingService.getFirePoint();
  }

  ngOnInit(): void {
  }


}
