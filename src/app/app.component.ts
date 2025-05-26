import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DynamicRendererComponent } from './components/dynamic-renderer/dynamic-renderer.component';
import { UIConfig } from './models/ui-config.interface';

@Component({
  selector: 'app-root',
  imports: [DynamicRendererComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'flick-ui';
  currentDemo = '';
  currentConfig: UIConfig | null = null;
  
  availableDemos = [
    { key: 'dashboard', name: 'Dashboard Demo', configPath: 'assets/configs/dashboard-demo.json' },
    { key: 'form', name: 'Form Demo', configPath: 'assets/configs/form-demo.json' },
    { key: 'table', name: 'Table Demo', configPath: 'assets/configs/table-demo.json' },
    { key: 'complete', name: 'Complete Demo', configPath: 'assets/configs/complete-demo.json' }
  ];

  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    // Initialize with dashboard demo
    this.loadDemo('dashboard');
  }
  
  loadDemo(demoKey: string) {
    this.currentDemo = demoKey;
    const demo = this.availableDemos.find(d => d.key === demoKey);
    
    if (demo) {
      this.http.get<UIConfig>(demo.configPath).subscribe({
        next: (config) => {
          this.currentConfig = config;
        },
        error: (error) => {
          console.error(`Failed to load demo configuration: ${demo.name}`, error);
          this.currentConfig = null;
        }
      });
    }
  }
}
