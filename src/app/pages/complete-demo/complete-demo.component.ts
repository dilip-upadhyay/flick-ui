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
  templateUrl: './complete-demo.component.html',
  styleUrls: ['./complete-demo.component.css']
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
