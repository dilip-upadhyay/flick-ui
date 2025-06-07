import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [CommonModule, MaterialModule],  templateUrl: './ui-file-upload.component.html',
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
