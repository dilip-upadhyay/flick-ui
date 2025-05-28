import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { DynamicRendererComponent } from '../../components/dynamic-renderer/dynamic-renderer.component';
import { UIConfig } from '../../models/ui-config.interface';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, MaterialModule, DynamicRendererComponent],
  template: `
    <div class="preview-container" [class]="getContainerClasses()">
      <!-- Preview Header (can be hidden in fullscreen mode) -->
      <div class="preview-header" *ngIf="!fullscreen">
        <div class="header-content">
          <mat-icon>preview</mat-icon>
          <h1>Layout Preview</h1>
          <span class="preview-info" *ngIf="config?.metadata?.title">{{ config?.metadata?.title }}</span>
        </div>
        
        <div class="header-actions">
          <button mat-icon-button 
                  (click)="toggleFullscreen()"
                  matTooltip="Toggle Fullscreen">
            <mat-icon>{{ fullscreen ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
          </button>
          
          <button mat-icon-button 
                  (click)="closePreview()"
                  matTooltip="Close Preview">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Dynamic Renderer Content -->
      <div class="preview-content">
        <div class="renderer-wrapper" *ngIf="config">
          <app-dynamic-renderer [config]="config"></app-dynamic-renderer>
        </div>
        
        <!-- Loading State -->
        <div class="loading-state" *ngIf="!config && !error">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading preview...</p>
        </div>
        
        <!-- Error State -->
        <div class="error-state" *ngIf="error">
          <mat-icon color="warn">error_outline</mat-icon>
          <h3>Preview Error</h3>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="closePreview()">
            Return to Designer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .preview-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
    }
    
    .preview-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      background: white;
    }
    
    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .header-content mat-icon {
      color: #2196f3;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .header-content h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: #333;
    }
    
    .preview-info {
      font-size: 14px;
      color: #666;
      background: #f0f0f0;
      padding: 4px 8px;
      border-radius: 4px;
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .preview-content {
      flex: 1;
      overflow: auto;
      position: relative;
    }
    
    .renderer-wrapper {
      height: 100%;
      background: white;
    }
    
    .loading-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 40px;
    }
    
    .loading-state mat-spinner {
      margin-bottom: 20px;
    }
    
    .error-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    .error-state h3 {
      margin: 0 0 8px 0;
      color: #f44336;
    }
    
    .error-state p {
      margin: 0 0 24px 0;
      color: #666;
      max-width: 400px;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .preview-header {
        padding: 12px 16px;
      }
      
      .header-content h1 {
        font-size: 18px;
      }
      
      .preview-info {
        display: none;
      }
    }
  `]
})
export class PreviewComponent implements OnInit {
  config: UIConfig | null = null;
  error: string | null = null;
  fullscreen = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadPreviewConfig();
  }

  private loadPreviewConfig(): void {
    // Try to get config from route query params
    this.route.queryParams.subscribe(params => {
      if (params['config']) {
        try {
          this.config = JSON.parse(decodeURIComponent(params['config']));
        } catch (error) {
          this.error = 'Invalid configuration data provided';
          console.error('Preview config parse error:', error);
        }
      } else {
        // Try to get from session storage (set by designer)
        if (typeof window !== 'undefined' && window.sessionStorage) {
          const storedConfig = sessionStorage.getItem('preview-config');
          if (storedConfig) {
            try {
              this.config = JSON.parse(storedConfig);
            } catch (error) {
              this.error = 'Invalid stored configuration data';
              console.error('Preview stored config parse error:', error);
            }
          } else {
            this.error = 'No configuration provided for preview';
          }
        } else {
          this.error = 'Preview not available in server-side rendering mode';
        }
      }
    });
  }

  toggleFullscreen(): void {
    this.fullscreen = !this.fullscreen;
  }

  closePreview(): void {
    // If opened in a new window/tab, close it
    if (typeof window !== 'undefined') {
      if (window.opener) {
        window.close();
      } else {
        // Navigate back to designer
        window.history.back();
      }
    }
  }

  getContainerClasses(): string {
    const classes = ['preview-container'];
    if (this.fullscreen) {
      classes.push('fullscreen');
    }
    return classes.join(' ');
  }
}
