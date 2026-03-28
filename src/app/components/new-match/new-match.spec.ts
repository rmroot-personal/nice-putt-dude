import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewMatch } from './new-match';

describe('NewMatch', () => {
  let component: NewMatch;
  let fixture: ComponentFixture<NewMatch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewMatch],
    }).compileComponents();

    fixture = TestBed.createComponent(NewMatch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
