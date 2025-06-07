import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { DynamicRendererComponent } from '../../components/dynamic-renderer/dynamic-renderer.component';
import { UIConfig } from '../../models/ui-config.interface';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, MaterialModule, DynamicRendererComponent],
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewComponent implements OnInit {
  config: UIConfig | null = null;
  error: string | null = null;
  fullscreen = false;

  constructor(private readonly route: ActivatedRoute, private readonly configService: ConfigService) {}

  ngOnInit(): void {
    debugger
    this.loadPreviewConfig();
  }

  private loadPreviewConfig(): void {
    // Try to get config from route query params
    this.route.queryParams.subscribe(params => {
      if (params['config']) {
        const configParam = params['config'];
        
        // Check if it's a filename (doesn't start with { and doesn't contain spaces in JSON-like format)
        if (!configParam.trim().startsWith('{') && !configParam.includes('"type"')) {
          // Treat as filename - load from assets/configs/
          const configPath = `assets/configs/${configParam}.json`;
          this.configService.loadConfig(configPath).subscribe({
            next: (config) => {
              this.config = config;
            },
            error: (error) => {
              this.error = `Failed to load configuration file: ${configParam}`;
              console.error('Preview config file load error:', error);
            }
          });
        } else {
          // Treat as inline JSON
          try {
            this.config = JSON.parse(decodeURIComponent(configParam));
          } catch (error) {
            this.error = 'Invalid configuration data provided';
            console.error('Preview config parse error:', error);
          }
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
      console.log("config: " + this.config);
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
