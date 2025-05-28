import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'form',
    loadComponent: () => import('./pages/form/form.component').then(m => m.FormComponent)
  },
  {
    path: 'complete',
    loadComponent: () => import('./pages/complete-demo/complete-demo.component').then(m => m.CompleteDemoComponent)
  },
  {
    path: 'designer',
    loadComponent: () => import('./pages/designer/designer.component').then(m => m.DesignerComponent)
  },
  {
    path: 'preview',
    loadComponent: () => import('./pages/preview/preview.component').then(m => m.PreviewComponent)
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
