import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MaterialModule } from './Material/material.module';
import { Header } from './header/header';
import { SideNav } from './side-nav/side-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, MaterialModule, Header, SideNav],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'NewFlats';
}
