import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { FormConfig } from '../../models/ui-config.interface';
import { FormRendererComponent } from '../../components/form-renderer/form-renderer.component';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormRendererComponent],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  currentConfig: FormConfig | null = null;

  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    console.log('FormComponent ngOnInit called');
    
    // Load form configuration from JSON file
    this.http.get<FormConfig>('assets/configs/form-config.json').subscribe({
      next: (config) => {
        console.log('Form config loaded successfully:', config);
        this.currentConfig = config;
      },
      error: (error) => {
        console.error('Error loading form configuration:', error);
      }
    });
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
