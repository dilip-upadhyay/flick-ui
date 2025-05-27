import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonAppearance = 'raised' | 'flat' | 'stroked' | 'fab' | 'mini-fab' | 'icon';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <!-- Raised Button -->
    <button 
      *ngIf="appearance === 'raised'"
      mat-raised-button
      [type]="type"
      [disabled]="disabled || loading"
      [color]="getMatColor()"
      [class]="getCustomClasses()"
      (click)="onClick()">
      
      <mat-icon *ngIf="loading && type === 'submit'">hourglass_empty</mat-icon>
      <mat-icon *ngIf="!loading && icon">{{ icon }}</mat-icon>
      
      <span *ngIf="label" [class.button-label-with-icon]="icon || (loading && type === 'submit')">
        {{ label }}
      </span>
    </button>

    <!-- Flat Button -->
    <button 
      *ngIf="appearance === 'flat'"
      mat-flat-button
      [type]="type"
      [disabled]="disabled || loading"
      [color]="getMatColor()"
      [class]="getCustomClasses()"
      (click)="onClick()">
      
      <mat-icon *ngIf="loading && type === 'submit'">hourglass_empty</mat-icon>
      <mat-icon *ngIf="!loading && icon">{{ icon }}</mat-icon>
      
      <span *ngIf="label" [class.button-label-with-icon]="icon || (loading && type === 'submit')">
        {{ label }}
      </span>
    </button>

    <!-- Stroked Button -->
    <button 
      *ngIf="appearance === 'stroked'"
      mat-stroked-button
      [type]="type"
      [disabled]="disabled || loading"
      [color]="getMatColor()"
      [class]="getCustomClasses()"
      (click)="onClick()">
      
      <mat-icon *ngIf="loading && type === 'submit'">hourglass_empty</mat-icon>
      <mat-icon *ngIf="!loading && icon">{{ icon }}</mat-icon>
      
      <span *ngIf="label" [class.button-label-with-icon]="icon || (loading && type === 'submit')">
        {{ label }}
      </span>
    </button>

    <!-- FAB Button -->
    <button 
      *ngIf="appearance === 'fab'"
      mat-fab
      [type]="type"
      [disabled]="disabled || loading"
      [color]="getMatColor()"
      [class]="getCustomClasses()"
      (click)="onClick()">
      
      <mat-icon *ngIf="loading && type === 'submit'">hourglass_empty</mat-icon>
      <mat-icon *ngIf="!loading && icon">{{ icon }}</mat-icon>
      
      <span *ngIf="label && appearance !== 'fab' && appearance !== 'mini-fab'" [class.button-label-with-icon]="icon || (loading && type === 'submit')">
        {{ label }}
      </span>
    </button>

    <!-- Mini FAB Button -->
    <button 
      *ngIf="appearance === 'mini-fab'"
      mat-mini-fab
      [type]="type"
      [disabled]="disabled || loading"
      [color]="getMatColor()"
      [class]="getCustomClasses()"
      (click)="onClick()">
      
      <mat-icon *ngIf="loading && type === 'submit'">hourglass_empty</mat-icon>
      <mat-icon *ngIf="!loading && icon">{{ icon }}</mat-icon>
    </button>

    <!-- Icon Button -->
    <button 
      *ngIf="appearance === 'icon'"
      mat-icon-button
      [type]="type"
      [disabled]="disabled || loading"
      [color]="getMatColor()"
      [class]="getCustomClasses()"
      (click)="onClick()">
      
      <mat-icon *ngIf="loading && type === 'submit'">hourglass_empty</mat-icon>
      <mat-icon *ngIf="!loading && icon">{{ icon }}</mat-icon>
    </button>

    <!-- Default Button (no directive) -->
    <button 
      *ngIf="!appearance || (appearance !== 'raised' && appearance !== 'flat' && appearance !== 'stroked' && appearance !== 'fab' && appearance !== 'mini-fab' && appearance !== 'icon')"
      mat-button
      [type]="type"
      [disabled]="disabled || loading"
      [color]="getMatColor()"
      [class]="getCustomClasses()"
      (click)="onClick()">
      
      <mat-icon *ngIf="loading && type === 'submit'">hourglass_empty</mat-icon>
      <mat-icon *ngIf="!loading && icon">{{ icon }}</mat-icon>
      
      <span *ngIf="label" [class.button-label-with-icon]="icon || (loading && type === 'submit')">
        {{ label }}
      </span>
    </button>
  `,
  styleUrls: ['./ui-button.component.css']
})
export class UiButtonComponent {
  @Input() type: ButtonType = 'button';
  @Input() variant: ButtonVariant = 'primary';
  @Input() appearance: ButtonAppearance = 'raised';
  @Input() label = '';
  @Input() icon = '';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() customClasses = '';

  @Output() buttonClick = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit();
    }
  }

  getMatColor(): string {
    switch (this.variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'accent';
      case 'danger':
        return 'warn';
      case 'success':
        return 'primary';
      case 'warning':
        return 'accent';
      default:
        return 'primary';
    }
  }

  getCustomClasses(): string {
    const classes = ['ui-button'];
    
    // Add variant class for custom styling
    classes.push(`ui-button-${this.variant}`);
    
    // Add custom classes
    if (this.customClasses) {
      classes.push(this.customClasses);
    }
    
    return classes.join(' ');
  }
}
