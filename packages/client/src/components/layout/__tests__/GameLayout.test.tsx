import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('GameLayout — RoomPage 레이아웃 구조 확인', () => {
  const roomPagePath = resolve(__dirname, '../../../pages/RoomPage.tsx');
  const roomPageSource = readFileSync(roomPagePath, 'utf-8');

  it('데스크탑 3열 그리드 클래스 grid-cols-[256px_1fr_*] 존재', () => {
    expect(roomPageSource).toMatch(/grid-cols-\[256px_1fr_\d+px\]/);
  });

  it('h-dvh 클래스 존재 (스크롤 없는 전체 높이)', () => {
    expect(roomPageSource).toContain('h-dvh');
  });

  it('overflow-hidden 클래스 존재', () => {
    expect(roomPageSource).toContain('overflow-hidden');
  });

  it('모바일 수직 레이아웃 md:hidden flex flex-col 존재', () => {
    expect(roomPageSource).toContain('md:hidden flex flex-col');
  });
});

describe('GameLayout — GameTable 배경 이미지 확인', () => {
  const gameTablePath = resolve(__dirname, '../GameTable.tsx');
  const gameTableSource = readFileSync(gameTablePath, 'utf-8');

  it('GameTable.tsx에 background.jpg 문자열 존재', () => {
    expect(gameTableSource).toContain('background.jpg');
  });

  it('GameTable.tsx에 backgroundSize 존재', () => {
    expect(gameTableSource).toContain('backgroundSize');
  });
});
