import { Component } from '@angular/core';
import { ContactFormComponent } from '../modules/contact-form/contact-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ContactFormComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Contact Form App';
}