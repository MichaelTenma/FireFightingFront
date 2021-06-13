import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FireStationInformationComponent } from './fireStationInformation.component';

describe('InformationComponent', () => {
  let component: FireStationInformationComponent;
  let fixture: ComponentFixture<FireStationInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FireStationInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FireStationInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
