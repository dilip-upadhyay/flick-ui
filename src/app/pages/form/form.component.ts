import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { DynamicRendererComponent } from '../../components/dynamic-renderer/dynamic-renderer.component';
import { UIConfig } from '../../models/ui-config.interface';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, DynamicRendererComponent],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <mat-card-header>
          <div mat-card-avatar class="page-header-icon">
            <mat-icon>assignment</mat-icon>
          </div>
          <mat-card-title>Forms</mat-card-title>
          <mat-card-subtitle>Dynamic form components with validation and controls</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          @if (currentConfig) {
            <div class="renderer-container">
              <app-dynamic-renderer [config]="currentConfig"></app-dynamic-renderer>
            </div>
          } @else {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading form configuration...</p>
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
      background-color: #388e3c;
      color: white;
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
export class FormComponent implements OnInit {
  currentConfig: UIConfig | null = null;

  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    // Load form demo configuration
    this.http.get<UIConfig>('assets/configs/form-demo.json').subscribe({
      next: (config) => {
        this.currentConfig = config;
      },
      error: (error) => {
        console.error('Error loading form configuration:', error);
      }
    });
  }
}
