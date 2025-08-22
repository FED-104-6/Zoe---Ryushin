import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Flat } from '../models/flat.model';

@Component({
  standalone: true,
  selector: 'flat-view-card',
  imports: [CommonModule],
  template: `
  <article class="property-card property-card--view">
    <header class="property-card__header">
      <h1 class="property-card__title">
        {{ f.title || (f.city + ' · ' + f.streetName + ' ' + f.streetNumber) }}
      </h1>
    </header>

    <section class="property-card__meta">
      <ul class="meta-list">
        <li><span class="meta-label">City</span><span class="meta-value">{{ f.city }}</span></li>
        <li><span class="meta-label">Street</span><span class="meta-value">{{ f.streetName }} {{ f.streetNumber }}</span></li>
        <li><span class="meta-label">Area</span><span class="meta-value">{{ f.areaSize }} m²</span></li>
        <li><span class="meta-label">Year</span><span class="meta-value">{{ f.yearBuilt }}</span></li>
        <li><span class="meta-label">Rent</span><span class="meta-value">{{ f.rentPrice }}/month</span></li>
        <li><span class="meta-label">Available</span><span class="meta-value">{{ f.dateAvailable | date }}</span></li>
        <li><span class="meta-label">AC</span><span class="meta-value"><span class="tag">{{ f.hasAC ? 'Yes' : 'No' }}</span></span></li>
      </ul>
    </section>
  </article>
  `
})
export class FlatViewCard {
  @Input({ required: true }) f!: Flat;
}
