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
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
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
