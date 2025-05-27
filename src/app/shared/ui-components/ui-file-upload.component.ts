import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="file-field">
      <div class="field-label" *ngIf="label">
        {{ label }}
        <span *ngIf="required" class="required-indicator">*</span>
      </div>
      
      <button 
        type="button" 
        mat-raised-button 
        color="primary"
        (click)="fileInput.click()">
        <mat-icon>upload</mat-icon>
        {{ buttonLabel }}
      </button>
      
      <input 
        #fileInput
        type="file"
        [id]="id"
        [multiple]="multiple"
        [accept]="accept"
        style="display: none"
        (change)="onFileChange($event)">
      
      <div *ngIf="selectedFiles.length > 0" class="selected-files">
        <div *ngFor="let file of selectedFiles" class="file-item">
          <mat-icon>description</mat-icon>
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">({{ formatFileSize(file.size) }})</span>
          <button 
            type="button" 
            mat-icon-button 
            color="warn"
            (click)="removeFile(file)">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      
      <div *ngIf="hint" class="field-hint">{{ hint }}</div>
      <div *ngIf="errors.length > 0" class="field-errors">
        <div *ngFor="let error of errors" class="error-message">{{ error }}</div>
      </div>
    </div>
  `,
  styleUrls: ['./ui-file-upload.component.css']
})
export class UiFileUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() id!: string;
  @Input() label = '';
  @Input() buttonLabel = 'Choose File';
  @Input() required = false;
  @Input() disabled = false;
  @Input() multiple = false;
  @Input() accept = '';
  @Input() hint = '';
  @Input() errors: string[] = [];

  @Output() fileChanged = new EventEmitter<File[]>();
  @Output() fileRemoved = new EventEmitter<File>();

  selectedFiles: File[] = [];

  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const files = Array.from(target.files);
      
      if (this.multiple) {
        this.selectedFiles = [...this.selectedFiles, ...files];
      } else {
        this.selectedFiles = files;
      }
      
      this.fileChanged.emit(this.selectedFiles);
    }
  }

  removeFile(fileToRemove: File): void {
    this.selectedFiles = this.selectedFiles.filter(file => file !== fileToRemove);
    this.fileRemoved.emit(fileToRemove);
    this.fileChanged.emit(this.selectedFiles);
    
    // Clear the input value if no files remain
    if (this.selectedFiles.length === 0) {
      this.fileInput.nativeElement.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  clearFiles(): void {
    this.selectedFiles = [];
    this.fileInput.nativeElement.value = '';
    this.fileChanged.emit(this.selectedFiles);
  }
}
