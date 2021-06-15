import { Component, OnInit } from '@angular/core';
import { FireThing } from 'src/FireThing';
import { GameTimeService } from 'src/Service/GameTimeService';
import { FireThingService } from '../../Service/FireThingService';
import { StatusService } from '../../Service/StatusService';

@Component({
  selector: 'app-construction',
  templateUrl: './construction.component.html',
  styleUrls: ['./construction.component.css']
})
export class ConstructionComponent implements OnInit  {
  fireThingService : FireThingService;
  private statusService : StatusService;
  gameTimeScale: number;
  gameTimeService: GameTimeService;

  constructor(
    fireThingService : FireThingService,
    statusService : StatusService,
    gameTimeService: GameTimeService
  ) { 
    this.fireThingService = fireThingService;
    this.statusService = statusService;
    this.gameTimeService = gameTimeService;
  }

  ngOnInit(): void {
  }

  getIcon(name : String) : String{
    return this.fireThingService.getUrlByName(name);
  }

  private lastIndex:Number = -1;
  itemClick(ele : FireThing, currentIndex : Number){
    // console.log(ele);
    if(this.lastIndex == currentIndex){
      this.statusService.endConstruct();
    }else{
      this.statusService.beginConstruct(ele);
      this.lastIndex = currentIndex;
    }
  }

  getUserMoney() : number{
    return this.statusService.getUserMoney();
  }

  scale(factor: number) {
    this.gameTimeService.setGameTimeScale(factor);
  }

}
