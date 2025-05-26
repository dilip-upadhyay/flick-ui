import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterModule],
  template: `
    <div class="home-container">
      <div class="hero-section">
        <mat-card class="hero-card">
          <mat-card-header>
            <div mat-card-avatar class="hero-icon">
              <mat-icon>dynamic_feed</mat-icon>
            </div>
            <mat-card-title>Dynamic UI Renderer</mat-card-title>
            <mat-card-subtitle>Build dynamic user interfaces with configuration-driven components</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <p class="hero-description">
              Explore our powerful dynamic UI rendering system that allows you to create 
              complex user interfaces through simple JSON configurations. From dashboards 
              to forms, everything is dynamically generated and fully customizable.
            </p>
            
            <div class="features-grid">
              <div class="feature-item">
                <mat-icon color="primary">dashboard</mat-icon>
                <h3>Dynamic Dashboards</h3>
                <p>Create responsive dashboard layouts with configurable widgets</p>
              </div>
              
              <div class="feature-item">
                <mat-icon color="primary">assignment</mat-icon>
                <h3>Interactive Forms</h3>
                <p>Build complex forms with validation and various input controls</p>
              </div>
              
              <div class="feature-item">
                <mat-icon color="primary">view_module</mat-icon>
                <h3>Modular Components</h3>
                <p>Compose interfaces from reusable, configuration-driven components</p>
              </div>
              
              <div class="feature-item">
                <mat-icon color="primary">settings</mat-icon>
                <h3>Flexible Configuration</h3>
                <p>JSON-based configuration system for rapid prototyping</p>
              </div>
            </div>
          </mat-card-content>
          
          <mat-card-actions class="hero-actions">
            <button mat-raised-button color="primary" routerLink="/dashboard">
              <mat-icon>dashboard</mat-icon>
              Explore Dashboards
            </button>
            <button mat-raised-button color="accent" routerLink="/form">
              <mat-icon>assignment</mat-icon>
              Try Forms
            </button>
            <button mat-stroked-button routerLink="/complete">
              <mat-icon>view_comfy</mat-icon>
              Complete Demo
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
      
      <div class="quick-links">
        <h2>Quick Navigation</h2>
        <div class="links-grid">
          <mat-card class="link-card" routerLink="/dashboard">
            <mat-icon color="primary">dashboard</mat-icon>
            <h3>Dashboard</h3>
            <p>Dynamic dashboard components</p>
          </mat-card>
          
          <mat-card class="link-card" routerLink="/form">
            <mat-icon color="primary">assignment</mat-icon>
            <h3>Forms</h3>
            <p>Interactive form builders</p>
          </mat-card>
          
          <mat-card class="link-card" routerLink="/complete">
            <mat-icon color="primary">view_comfy</mat-icon>
            <h3>Complete Demo</h3>
            <p>All components showcase</p>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .hero-section {
      margin-bottom: 40px;
    }
    
    .hero-card {
      text-align: center;
    }
    
    .hero-icon {
      background-color: #1976d2;
      color: white;
      margin: 0 auto;
    }
    
    .hero-description {
      font-size: 16px;
      line-height: 1.6;
      margin: 24px 0;
      color: rgba(0, 0, 0, 0.7);
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin: 32px 0;
    }
    
    .feature-item {
      text-align: center;
      padding: 16px;
    }
    
    .feature-item mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    .feature-item h3 {
      margin: 8px 0;
      color: #1976d2;
    }
    
    .feature-item p {
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
    }
    
    .hero-actions {
      justify-content: center;
      gap: 16px;
      margin-top: 24px;
    }
    
    .hero-actions button {
      margin: 0 8px;
    }
    
    .quick-links h2 {
      text-align: center;
      margin-bottom: 24px;
      color: #333;
    }
    
    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    
    .link-card {
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .link-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .link-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    .link-card h3 {
      margin: 8px 0;
      color: #1976d2;
    }
    
    .link-card p {
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
      margin: 0;
    }
  `]
})
export class HomeComponent {}
