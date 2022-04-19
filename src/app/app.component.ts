import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SQLiteService } from './services/sqlite.service';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private sqlite: SQLiteService,
  ) {
    this.platform.ready().then( () => {
      this.platform.backButton.subscribeWithPriority(
                                      666666, () => {
          App.exitApp();
      });
    });
    console.log('>>>> in App');
  }
}
