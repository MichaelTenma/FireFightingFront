import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FirePointInformationComponent } from './fire-point-information.component';

describe('FirePointInformationComponent', () => {
  let component: FirePointInformationComponent;
  let fixture: ComponentFixture<FirePointInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FirePointInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FirePointInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
