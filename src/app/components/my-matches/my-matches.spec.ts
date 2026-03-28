import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyMatches } from './my-matches';

describe('MyMatches', () => {
  let component: MyMatches;
  let fixture: ComponentFixture<MyMatches>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyMatches],
    }).compileComponents();

    fixture = TestBed.createComponent(MyMatches);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
