import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { HomeComponent } from './home.component';
import { environment } from '../../../environments/environment';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe creare il componente', () => {
    expect(component).toBeTruthy();
  });

  it('dovrebbe esporre la versione da environment.appVersion', () => {
    expect(component.version).toBe(environment.appVersion);
  });

  it('dovrebbe mostrare titolo e sottotitolo', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Card Tracker');
    expect(compiled.querySelector('.subtitle')?.textContent)
      .toContain('Gestisci la tua collezione di figurine');
  });

  it('dovrebbe mostrare il tag di versione nel DOM', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    const versionTag = compiled.querySelector('.version-tag');
    expect(versionTag?.textContent).toContain(`v${environment.appVersion}`);
  });

  it('dovrebbe avere esattamente 3 nav-card', () => {
    const cards = fixture.debugElement.queryAll(By.css('.nav-card'));
    expect(cards.length).toBe(3);
  });

  it('dovrebbe puntare ai routerLink corretti nell\'ordine giusto', () => {
    const links = fixture.debugElement.queryAll(By.css('.nav-card'));
    const hrefs = links.map(l => l.nativeElement.getAttribute('ng-reflect-router-link')
      ?? l.nativeElement.getAttribute('href'));

    expect(hrefs[0]).toContain('/collections');
    expect(hrefs[1]).toContain('/manage-collections');
    expect(hrefs[2]).toContain('/add-card');
  });

  it('ogni nav-card dovrebbe avere label e sublabel non vuoti', () => {
    const cards = fixture.debugElement.queryAll(By.css('.nav-card'));
    cards.forEach(card => {
      const label = card.query(By.css('.label'))?.nativeElement.textContent.trim();
      const sublabel = card.query(By.css('.sublabel'))?.nativeElement.textContent.trim();
      expect(label).toBeTruthy();
      expect(sublabel).toBeTruthy();
    });
  });
});