// src/app/app-data-display.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // For *ngIf, *ngFor, etc.
import { FormsModule } from '@angular/forms';   // For [(ngModel)]

@Component({
  selector: 'app-data-display', // How you'll use it in HTML: <app-data-display></app-data-display>
  standalone: true,             // Mark this as a standalone component
  imports: [
    CommonModule, // Import if you use *ngIf, *ngFor, date pipe, etc.
    FormsModule   // Import for two-way data binding with [(ngModel)]
  ],
  templateUrl: './binding-demo.component.html',
  styleUrls: ['./binding-demo.component.css']
})
export class AppDataDisplayComponent {
  // 1. String Interpolation {{ value }}
  title: string = 'Data Binding Demo (Standalone)';
  user = {
    name: 'Alice',
    age: 30
  };

  // 2. Property Binding [property]="value"
  imageUrl: string = 'https://via.placeholder.com/150/007bff/ffffff?text=Angular'; // Blue placeholder
  imageAlt: string = 'Sample Image';
  isButtonDisabled: boolean = false;

  // 3. Event Binding (event)="handler()"
  clickCount: number = 0;
  eventMessage: string = 'No events yet.';

  // 4. Two-Way Binding [(ngModel)]="property"
  inputText: string = 'Initial text';

  constructor() {
    // Simulate a change after some time
    setTimeout(() => {
      this.title = 'Title Updated!';
      this.isButtonDisabled = true;
      this.imageUrl = 'https://via.placeholder.com/150/28a745/ffffff?text=Updated'; // Green placeholder
    }, 3000);
  }

  onButtonClick(): void {
    this.clickCount++;
    this.eventMessage = `Button clicked ${this.clickCount} times.`;
  }

  onInputChange(event: Event): void {
    // Manual handling of input event (not two-way binding)
    const target = event.target as HTMLInputElement;
    this.eventMessage = `Input changed via (input) event: ${target.value}`;
  }

  resetInputText(): void {
    this.inputText = ''; // This will update the input field due to [(ngModel)]
  }
}