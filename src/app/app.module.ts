import {
  BrowserModule
} from '@angular/platform-browser';
import {
  NgModule
} from '@angular/core';
// import { FormsModule } from '@angular/forms';

import {
  AppRoutingModule
} from './app-routing.module';
import {
  AppComponent
} from './app.component';
import {
  ConstructionComponent
} from './construction/construction.component';
import {
  BrowserAnimationsModule
} from '@angular/platform-browser/animations';

// import { FireStationPopupComponent } from './Popup/FireStationPopup/FireStationPopup.component';

// import { MatSliderModule } from '@angular/material/slider';
import {
  MatTabsModule
} from '@angular/material/tabs';
import {
  SelectedDirective
} from './Directives/selected.directive';
import {
  RMBFormatPipe
} from './Pipe/RMBFormat.pipe';

import {
  MatSelectModule
} from '@angular/material/select';
import {
  NgbPaginationModule,
  NgbAlertModule,
  NgbModule
} from '@ng-bootstrap/ng-bootstrap';
import {
  FireStationInformationComponent
} from './fireStationInformation/fireStationInformation.component';

import {
  MatButtonModule
} from '@angular/material/button';
import {
  FirePointInformationComponent
} from './fire-point-information/fire-point-information.component';
import {
  MatSliderModule
} from '@angular/material/slider';
import {
  HttpClientModule
} from '@angular/common/http';
import {
  StatisticComponent
} from './statistic/statistic.component';
import {MatListModule} from '@angular/material/list';
@NgModule({
  declarations: [
    AppComponent,
    ConstructionComponent,
    SelectedDirective,
    RMBFormatPipe,
    // FireStationPopupComponent,
    FireStationInformationComponent,
    FirePointInformationComponent,
    StatisticComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatTabsModule, MatButtonModule, MatSliderModule, MatSelectModule,MatListModule,
    NgbPaginationModule, NgbAlertModule, NgbModule, HttpClientModule
  ],
  // providers: [RMBFormatPipe],
  bootstrap: [AppComponent]
})
export class AppModule {}
