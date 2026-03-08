import { Component, signal } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { App } from './app';

describe('App Component (independent test)', () => {
  const app = new App();

  it('should create the component', () => {
    expect(app).toBeTruthy();
  });

  it('should have the default title', () => {
    expect(app.title()).toBe('Video Games Managment');
  });

  it('should allow updating the title signal', () => {
    app.title.set('My New Title');
    expect(app.title()).toBe('My New Title');
  });
});
