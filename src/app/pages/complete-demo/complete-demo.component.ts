import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { DynamicRendererComponent } from '../../components/dynamic-renderer/dynamic-renderer.component';
import { UIConfig } from '../../models/ui-config.interface';

@Component({
  selector: 'app-complete-demo',
  standalone: true,
  imports: [CommonModule, MaterialModule, DynamicRendererComponent],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <mat-card-header>
          <div mat-card-avatar class="page-header-icon">
            <mat-icon>view_comfy</mat-icon>
          </div>
          <mat-card-title>Complete Demo</mat-card-title>
          <mat-card-subtitle>Comprehensive showcase of all available UI components</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="info-section">
            <mat-chip-listbox>
              <mat-chip-option selected>
                <mat-icon matChipAvatar>dashboard</mat-icon>
                Dashboards
              </mat-chip-option>
              <mat-chip-option selected>
                <mat-icon matChipAvatar>assignment</mat-icon>
                Forms
              </mat-chip-option>
              <mat-chip-option selected>
                <mat-icon matChipAvatar>view_module</mat-icon>
                Components
              </mat-chip-option>
            </mat-chip-listbox>
          </div>
          
          @if (currentConfig) {
            <div class="renderer-container">
              <app-dynamic-renderer 
                [config]="currentConfig"
                [context]="{ mode: 'demo' }">
              </app-dynamic-renderer>
            </div>
          } @else {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading complete demo configuration...</p>
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
      background-color: #7b1fa2;
      color: white;
    }
    
    .info-section {
      margin-bottom: 24px;
    }
    
    .info-section mat-chip-listbox {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .renderer-container {
      margin-top: 20px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      text-align: center;
    }
    
    .loading-container p {
      margin-top: 16px;
      color: rgba(0, 0, 0, 0.6);
    }
  `]
})
export class CompleteDemoComponent implements OnInit {
  currentConfig: UIConfig | null = null;

  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    // Load complete demo configuration
    this.http.get<UIConfig>('assets/configs/complete-demo.json').subscribe({
      next: (config) => {
        this.currentConfig = config;
      },
      error: (error) => {
        console.error('Error loading complete demo configuration:', error);
      }
    });
  }
}
