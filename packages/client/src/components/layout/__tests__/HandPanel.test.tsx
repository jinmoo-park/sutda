import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const handPanelPath = resolve(__dirname, '../HandPanel.tsx');
const source = readFileSync(handPanelPath, 'utf-8');

describe('HandPanel — HwatuCard 교체 확인', () => {
  it('HwatuCard import 존재', () => {
    expect(source).toContain("import { HwatuCard }");
  });

  it('CardFace import 없음', () => {
    expect(source).not.toContain("import { CardFace }");
    expect(source).not.toContain("from '@/components/game/CardFace'");
  });

  it('CardBack import 없음', () => {
    expect(source).not.toContain("import { CardBack }");
    expect(source).not.toContain("from '@/components/game/CardBack'");
  });
});

describe('HandPanel — flip 인터랙션 구현 확인', () => {
  it('flippedIndices 상태 존재', () => {
    expect(source).toContain('flippedIndices');
  });

  it('onAllFlipped prop 존재', () => {
    expect(source).toContain('onAllFlipped');
  });

  it('dealingComplete prop 존재', () => {
    expect(source).toContain('dealingComplete');
  });

  it('handleFlip 함수 존재', () => {
    expect(source).toContain('handleFlip');
  });

  it('2장 모두 뒤집으면 onAllFlipped 호출 패턴', () => {
    expect(source).toContain('next.size >= 2');
    expect(source).toContain('onAllFlipped()');
  });

  it('1장만 뒤집은 상태 힌트 텍스트 존재', () => {
    expect(source).toContain('나머지 카드를 탭해서 확인하세요');
  });

  it('2장 모두 뒤집었을 때만 족보 표시 조건', () => {
    expect(source).toContain('flippedIndices.size >= 2');
  });
});

describe('HandPanel — 배분 애니메이션 확인', () => {
  it('deal-fly-in 또는 dealAnimStyle 관련 코드 존재', () => {
    expect(source).toMatch(/deal-fly-in|getDealAnimStyle|dealAnimStyle/);
  });

  it('animationDelay 코드 존재', () => {
    expect(source).toContain('animationDelay');
  });
});

describe('HandPanel — phase 리셋 동작', () => {
  it('phase 변경 시 flippedIndices 리셋 useEffect 존재', () => {
    expect(source).toContain('setFlippedIndices(new Set())');
  });
});
