import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayMatch } from './play-match';

describe('PlayMatch', () => {
  let component: PlayMatch;
  let fixture: ComponentFixture<PlayMatch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayMatch],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayMatch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
