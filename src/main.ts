import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { TokenExpirationInterceptor } from './app/core/interceptors/token-expiration.interceptor';
import { provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';




import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

registerLocaleData(localeEs, 'es');

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: LOCALE_ID, useValue: 'es' },
    {
  provide: HTTP_INTERCEPTORS,
  useClass: TokenExpirationInterceptor,
  multi: true
},
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient()
  ],
}).then(() => {
  defineCustomElements(window);
});
