import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonAppearance = 'raised' | 'flat' | 'stroked' | 'fab' | 'mini-fab' | 'icon';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule, MaterialModule],  templateUrl: './ui-button.component.html',
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
