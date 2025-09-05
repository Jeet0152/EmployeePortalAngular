import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ModalModule } from 'ngx-bootstrap/modal';

import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    // ngx-bootstrap modules
    importProvidersFrom(
      CollapseModule.forRoot(),
      PaginationModule.forRoot(),
      ModalModule.forRoot()
    ),
    // ngx-translate (v17+)
    importProvidersFrom(
      TranslateModule.forRoot({ defaultLanguage: 'en' })
    ),
    provideTranslateHttpLoader({
      prefix: 'assets/i18n/',
      suffix: '.json',
      // optional flags:
      // enforceLoading: false,
      // useHttpBackend: false,
    }),
  ],
}).catch(err => console.error(err));
