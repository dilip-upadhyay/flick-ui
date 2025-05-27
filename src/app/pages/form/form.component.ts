import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { FormRendererComponent } from '../../components/form-renderer/form-renderer.component';
import { FormConfig } from '../../models/ui-config.interface';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormRendererComponent],
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
              <app-form-renderer 
                [config]="currentConfig"
                (event)="onFormEvent($event)">
              </app-form-renderer>
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
  currentConfig: FormConfig | null = null;

  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    console.log('FormComponent ngOnInit called');
    
    // Add a timeout to see if there's a timing issue
    setTimeout(() => {
      console.log('Attempting to load form config...');
      this.http.get<FormConfig>('assets/configs/form-config.json').subscribe({
        next: (config) => {
          console.log('Form config loaded successfully:', config);
          this.currentConfig = config;
        },
        error: (error) => {
          console.error('Error loading form configuration:', error);
        }
      });
    }, 100);
  }

  onFormEvent(event: any) {
    console.log('Form event:', event);
    
    switch (event.type) {
      case 'submit':
        console.log('Form submitted with data:', event.data);
        // Handle form submission here
        break;
      case 'reset':
        console.log('Form reset');
        break;
      case 'formChange':
        console.log('Form values changed:', event.data);
        break;
    }
  }
}
