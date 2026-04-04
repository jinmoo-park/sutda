# Milestones

## v1.0 온라인 섯다 MVP (Shipped: 2026-04-04)

**Phases completed:** 17 phases, 39 plans, 57 tasks  
**Timeline:** 2026-03-29 → 2026-04-04 (7일)  
**Codebase:** ~15,000 LOC TypeScript/TSX  
**Deployed:** sutda.duckdns.org (Oracle VM + PM2 + DuckDNS SSL)

**Key accomplishments:**

1. 5가지 게임 모드 완전 구현 — 오리지날/세장섯다/한장공유/골라골라/인디언섯다 모두 플레이 가능
2. 특수 규칙 완전 구현 — 땡값 자동 정산, 구사(94) 재경기 FSM, D-07(땡잡이/암행어사) 면제 로직
3. 화투 이미지 + UX 완성 — 3D 카드 뒤집기, 딜링 애니메이션, 셔플/기리 인터랙션, BGM/SFX 시스템
4. 소셜 기능 완성 — 채팅, 학교대신가주기, 뒤늦게 입장(Observer), 올인 POT 처리, 세션 종료 표시
5. 실서비스 배포 — Oracle VM + DuckDNS SSL + PM2, OWASP Top 10 Critical/High 취약점 전체 해소
6. 하우스룰 부가기능 — 방 생성 패스워드, BET-07 체크, 기리 스트리밍, SFX 17개 이벤트, 카드 한장씩 공개 플로우

**Tech Stack:** TypeScript 모노레포 (pnpm + turborepo), React 19 + Vite 6, Socket.IO 4.x, Node.js + nginx

---
