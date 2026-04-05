import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('BettingPanel', () => {
  it.todo('콜/레이즈/다이/체크 버튼이 표시된다');
  it.todo('내 턴이 아닐 때 버튼이 비활성화된다');
  it.todo('칩 단위 버튼으로 레이즈 금액을 조합할 수 있다');
});

describe('BettingPanel — BET-HIGHLIGHT ring+glow (소스 확인)', () => {
  const bettingPanelPath = resolve(__dirname, '../BettingPanel.tsx');
  const source = readFileSync(bettingPanelPath, 'utf-8');

  it('isMyTurn=true 조건부 ring-primary 클래스 존재', () => {
    expect(source).toContain('ring-primary');
  });

  it('ring-offset-background 클래스 존재', () => {
    expect(source).toContain('ring-offset-background');
  });

  it('shadow-[0_0_12px glow 스타일 존재', () => {
    expect(source).toContain('shadow-[0_0_12px');
  });

  it('cn import 존재', () => {
    expect(source).toContain("from '@/lib/utils'");
  });

  it('isMyTurn 조건부 ring 적용 패턴 존재', () => {
    expect(source).toContain('isMyTurn && "ring-2 ring-primary');
  });
});
