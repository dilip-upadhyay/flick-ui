import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MaterialModule } from './shared/material.module';

@Component({
  selector: 'app-root',
  imports: [CommonModule, MaterialModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Dynamic UI Renderer';
  
  navigationItems = [
    { path: '/home', name: 'Home', icon: 'home' },
    { path: '/dashboard', name: 'Dashboard', icon: 'dashboard' },
    { path: '/form', name: 'Forms', icon: 'assignment' },
    { path: '/complete', name: 'Complete Demo', icon: 'view_comfy' }
  ];

  constructor(private router: Router) {}
  
  navigateTo(path: string) {
    this.router.navigate([path]);
  }
  
  isActiveRoute(path: string): boolean {
    return this.router.url === path;
  }
}
