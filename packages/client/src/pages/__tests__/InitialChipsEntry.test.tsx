import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Initial chips entry UI', () => {
  const mainPageSource = readFileSync(resolve(__dirname, '../MainPage.tsx'), 'utf-8');
  const roomPageSource = readFileSync(resolve(__dirname, '../RoomPage.tsx'), 'utf-8');
  const stepperSource = readFileSync(resolve(__dirname, '../../components/entry/InitialChipsStepper.tsx'), 'utf-8');

  it('uses the shared stepper on host and invited-player entry screens', () => {
    expect(mainPageSource).toContain('InitialChipsStepper');
    expect(roomPageSource).toContain('InitialChipsStepper');
  });

  it('keeps initial chips at 100,000 and changes by 10,000', () => {
    expect(mainPageSource).toContain('useState(100000)');
    expect(stepperSource).toContain('const CHIP_STEP = 10000');
    expect(stepperSource).toContain("toLocaleString('ko-KR')");
  });

  it('does not expose the initial chips controls as direct number inputs', () => {
    expect(mainPageSource).not.toContain('type="number"');
    expect(roomPageSource).not.toContain('type="number"');
  });
});
