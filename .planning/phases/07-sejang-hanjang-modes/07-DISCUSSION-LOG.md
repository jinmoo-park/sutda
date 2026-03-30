# Phase 7: 세장섯다 + 한장공유 모드 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 07-sejang-hanjang-modes
**Areas discussed:** Strategy 패턴 구조, 세장섯다 3장 선택 UX, 한장공유 공유카드 지정 UX, 세장섯다 중간 베팅 타이밍

---

## Area 1: Strategy 패턴 구조

**Q: GameEngine의 모드별 로직을 어떻게 분리할까요?**
- Options: Strategy 클래스 분리 / GameEngine 내 if/switch 분기
- **Selected:** Strategy 클래스 분리 (OriginalMode, SejangMode, HanjangMode)

**Q: Strategy가 담당할 메서드 범위는?**
- Options: deal + showdown만 / deal + showdown + betting도 위임 / deal만
- **Selected:** deal + showdown만

**Q: shared 타입에 GameMode 추가 및 PlayerState 변경 범위는?**
- Options: GameMode만 확장 / selectedCards 필드 추가
- **Selected:** selectedCards 필드 추가 (`PlayerState.selectedCards?: Card[]`)

**Q: 한장공유의 공유카드는 어디에 저장할까요?**
- Options: GameState.sharedCard 필드 / deck[0] 직접 참조
- **Selected:** GameState.sharedCard 필드

---

## Area 2: 세장섯다 3장 선택 UX

**Q: 3장 중 2장 선택을 언제 할까요?**
- Options: 3번째 카드 배분 직후 자동 팝업 / 콜/다이 이후 쇼다운 직전
- **Selected:** 콜/다이 이후 쇼다운 직전 → (최종 결정: 1차 베팅 후, 2차 베팅 전 card-select phase)

**Q: 2장 선택 UI는 어떻게?**
- Options: 손패패널에서 카드 클릭 토글 / 별도 모달 팝업
- **Selected:** 손패패널에서 카드 클릭 토글 + 확인 버튼

---

## Area 3: 한장공유 공유카드 지정 UX

**Q: 선 플레이어가 공유카드 지정하는 UI는?**
- Options: DealerSelectModal 재사용 / 신규 SharedCardSelectModal
- **Selected:** DealerSelectModal 재사용 (밤일낮장 모달 기반)
- **Notes:** 딜러에게는 앞면이 다 보여서 자기가 원하는 공유카드를 전략적으로 설정할 수 있음. 다른 플레이어는 뒷면.

**Q: 공유카드가 지정된 후, 모든 플레이어에게 어떻게 보일까요?**
- Options: 중앙에 앞면 공개 / 손패패널에서 공유카드 + 내 손패 표시
- **Selected:** 게임 테이블 중앙에 앞면 공개

---

## Area 4: 세장섯다 중간 베팅 타이밍

**Q: 1차 베팅에서 '3번째 카드를 보지 않고 다이'하는 시점?**
- Options: 1차 베팅만 다이 가능, 이후 카드 받고 2차 베팅 / 2차 베팅 없이 1차 베팅 1두
- **Selected:** 1차 베팅만 다이 가능, 콜/레이즈하면 3번째 카드 받고 2차 베팅

**Q: 1차 베팅 후 3장째 더주는 타이밍과 phase 전환은?**
- Options: 1차 베팅 완료 직후 서버 자동 배분 / 플레이어가 '받을게요' 버튼
- **Selected:** 1차 베팅 완료 직후 서버가 자동으로 생존자에게 추가 배분

**Q: 새 GamePhase 구성은?**
- Options: 'betting-1' / 'dealing-extra' / 'card-select' / 'betting-2' / betting + subPhase 필드
- **Selected:** 'betting-1' / 'dealing-extra' / 'card-select' / 'betting-2' 별도 phase
