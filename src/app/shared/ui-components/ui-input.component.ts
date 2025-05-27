import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

export type InputType = 'text' | 'email' | 'password' | 'tel' | 'number';
export type InputAppearance = 'fill' | 'outline';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <mat-form-field 
      [appearance]="appearance"
      [class]="fieldClasses">
      <mat-label>{{ label }}
        <span *ngIf="required" class="required-indicator">*</span>
      </mat-label>
      <input 
        matInput
        [type]="type"
        [id]="id"
        [placeholder]="placeholder"
        [required]="required"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onBlur()"
        (focus)="onFocus()">
      <mat-icon matSuffix *ngIf="suffixIcon">{{ suffixIcon }}</mat-icon>
      <mat-hint *ngIf="hint">{{ hint }}</mat-hint>
      <mat-error *ngFor="let error of errors">{{ error }}</mat-error>
    </mat-form-field>
  `,
  styleUrls: ['./ui-input.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true
    }
  ]
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() id!: string;
  @Input() label!: string;
  @Input() type: InputType = 'text';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() hint = '';
  @Input() errors: string[] = [];
  @Input() suffixIcon = '';
  @Input() appearance: InputAppearance = 'outline';
  @Input() fieldClasses = 'full-width';

  @Output() inputChange = new EventEmitter<string>();
  @Output() inputBlur = new EventEmitter<void>();
  @Output() inputFocus = new EventEmitter<void>();

  value = '';
  
  private onChange = (value: string) => {};
  private onTouched = () => {};

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    // Angular will automatically disable the input through FormControl
  }

  // Event handlers
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }

  onBlur(): void {
    this.onTouched();
    this.inputBlur.emit();
  }

  onFocus(): void {
    this.inputFocus.emit();
  }
}
