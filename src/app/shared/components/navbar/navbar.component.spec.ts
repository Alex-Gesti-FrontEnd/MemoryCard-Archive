import { describe, it, expect, beforeEach } from 'vitest';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent (independent test)', () => {
  let component: NavbarComponent;

  beforeEach(() => {
    component = new NavbarComponent();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize menuOpen as false', () => {
    expect(component.menuOpen()).toBe(false);
  });

  it('should toggle the menu state', () => {
    component.toggleMenu();
    expect(component.menuOpen()).toBe(true);

    component.toggleMenu();
    expect(component.menuOpen()).toBe(false);
  });

  it('should close the menu', () => {
    component.toggleMenu();
    component.closeMenu();
    expect(component.menuOpen()).toBe(false);
  });
});
