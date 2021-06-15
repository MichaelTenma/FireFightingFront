import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticComponent } from './statistic.component';

describe('AppStatisticComponent', () => {
  let component: StatisticComponent;
  let fixture: ComponentFixture<StatisticComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StatisticComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatisticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
