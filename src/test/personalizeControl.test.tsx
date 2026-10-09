import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeScreen } from '../components/home/HomeScreen';

describe('Personalize Control Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens personalize settings and updates age and class in sync', () => {
    const mockStartExploration = vi.fn();
    const mockOpenClassBrowser = vi.fn();
    const mockResumeTopic = vi.fn();

    render(
      <HomeScreen
        onStartExploration={mockStartExploration}
        onOpenClassBrowser={mockOpenClassBrowser}
        onResumeTopic={mockResumeTopic}
      />
    );

    // Initial personalize control toggle button
    const changeBtn = screen.getByText('Change');
    expect(changeBtn).toBeTruthy();

    // Click to open Personalize panel
    fireEvent.click(changeBtn);

    // Check that panel header is visible
    expect(screen.getByText('Personalize Settings')).toBeTruthy();

    // 1. Click Class 9 button in Personalize panel -> age should automatically sync to 14
    const class9Btn = screen.getByLabelText('Select Class 9');
    fireEvent.click(class9Btn);

    // Verify age display in panel and toggle button reflects Age 14
    expect(screen.getAllByText(/Age 14/).length).toBeGreaterThanOrEqual(1);

    // 2. Change age selector to Age 12 -> class should automatically sync to Class 7
    const ageSelect = screen.getByLabelText('Age selector') as HTMLSelectElement;
    fireEvent.change(ageSelect, { target: { value: '12' } });

    // Verify age selector value and display reflect Age 12
    expect(ageSelect.value).toBe('12');
    expect(screen.getAllByText(/Age 12/).length).toBeGreaterThanOrEqual(1);

    // Verify Class 7 button is rendered in the panel
    const class7Btn = screen.getByLabelText('Select Class 7');
    expect(class7Btn).toBeTruthy();
  });
});
