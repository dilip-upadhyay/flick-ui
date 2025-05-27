import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

export interface RadioOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'ui-radio',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="radio-field">
      <div class="field-label" *ngIf="label">
        {{ label }}
        <span *ngIf="required" class="required-indicator">*</span>
      </div>
      
      <mat-radio-group 
        [value]="value"
        (change)="onRadioChange($event)"
        class="radio-group">
        <mat-radio-button 
          *ngFor="let option of options"
          [value]="option.value"
          [disabled]="option.disabled || false"
          class="radio-option">
          {{ option.label }}
        </mat-radio-button>
      </mat-radio-group>
      
      <div *ngIf="hint" class="field-hint">{{ hint }}</div>
      <div *ngIf="errors.length > 0" class="field-errors">
        <div *ngFor="let error of errors" class="error-message">{{ error }}</div>
      </div>
    </div>
  `,
  styleUrls: ['./ui-radio.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiRadioComponent),
      multi: true
    }
  ]
})
export class UiRadioComponent implements ControlValueAccessor {
  @Input() id!: string;
  @Input() label = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() hint = '';
  @Input() errors: string[] = [];
  @Input() options: RadioOption[] = [];

  @Output() radioChange = new EventEmitter<any>();

  value: any = '';
  
  private onChange = (value: any) => {};
  private onTouched = () => {};

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Event handlers
  onRadioChange(event: any): void {
    this.value = event.value;
    this.onChange(this.value);
    this.onTouched();
    this.radioChange.emit(this.value);
  }
}
