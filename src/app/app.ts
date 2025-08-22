import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MaterialModule } from './services/ui/material.module';
import { Header } from './layout/header/header';
import { SideNav } from './layout/side-nav/side-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, MaterialModule, Header, SideNav],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'NewFlats';
}
