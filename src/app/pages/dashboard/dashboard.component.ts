import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { DynamicRendererComponent } from '../../components/dynamic-renderer/dynamic-renderer.component';
import { UIConfig } from '../../models/ui-config.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule, DynamicRendererComponent],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <mat-card-header>
          <div mat-card-avatar class="page-header-icon">
            <mat-icon>dashboard</mat-icon>
          </div>
          <mat-card-title>Dashboard</mat-card-title>
          <mat-card-subtitle>Dynamic dashboard with configurable widgets</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="demo-selector">
            <mat-chip-listbox>
              @for (demo of dashboardDemos; track demo.key) {
                <mat-chip-option 
                  [selected]="currentDemo === demo.key"
                  (click)="loadDemo(demo.key)">
                  <mat-icon matChipAvatar>{{demo.icon}}</mat-icon>
                  {{ demo.name }}
                </mat-chip-option>
              }
            </mat-chip-listbox>
          </div>
          
          @if (currentConfig) {
            <div class="renderer-container">
              <app-dynamic-renderer 
                [config]="currentConfig"
                [context]="{ mode: 'dashboard' }">
              </app-dynamic-renderer>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .page-card {
      margin-bottom: 20px;
    }
    
    .page-header-icon {
      background-color: #1976d2;
      color: white;
    }
    
    .demo-selector {
      margin-bottom: 24px;
    }
    
    .demo-selector mat-chip-listbox {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .renderer-container {
      margin-top: 20px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentDemo = '';
  currentConfig: UIConfig | null = null;
  
  dashboardDemos = [
    { 
      key: 'dashboard', 
      name: 'Standard Dashboard', 
      configPath: 'assets/configs/dashboard-demo.json',
      icon: 'dashboard'
    },
    { 
      key: 'five-part', 
      name: 'Five-Part Layout', 
      configPath: 'assets/configs/five-part-dashboard-demo.json',
      icon: 'view_quilt'
    }
  ];

  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    // Initialize with standard dashboard demo
    this.loadDemo('dashboard');
  }
  
  loadDemo(demoKey: string) {
    this.currentDemo = demoKey;
    const demo = this.dashboardDemos.find(d => d.key === demoKey);
    
    if (demo) {
      this.http.get<UIConfig>(demo.configPath).subscribe({
        next: (config) => {
          this.currentConfig = config;
        },
        error: (error) => {
          console.error('Error loading demo configuration:', error);
        }
      });
    }
  }
}
