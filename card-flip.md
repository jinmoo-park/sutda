# 화투 카드 3D Flip 컴포넌트

## 카드 사이즈 표준

| 항목 | 값 |
|------|-----|
| 실물 화투 카드 | 48 × 76 mm |
| 가로:세로 비율 | 1 : 1.583 |
| 기본 구현 사이즈 | 68 × 110 px |
| 확대 사이즈 (예: 핸드 표시) | 85 × 135 px |
| 축소 사이즈 (예: 덱 더미) | 51 × 83 px |

> 이미지는 카드 컨테이너에 `object-fit: cover`로 채워넣음.  
> 이미지 원본 사이즈가 달라도 카드 틀이 고정되므로 통일됨.

---

## HTML 구조

```html
<!-- 카드 1장 단위 -->
<div class="hwatu-scene">
  <div class="hwatu-card">
    <div class="hwatu-face hwatu-front">
      <img src="./cards/01-1.png" alt="1월 1번" />
    </div>
    <div class="hwatu-face hwatu-back">
      <img src="./cards/card_back.jpg" alt="뒷면" />
    </div>
  </div>
</div>
```

---

## CSS

```css
/* ─── 카드 사이즈 토큰 ─── */
:root {
  --card-w: 68px;
  --card-h: 110px;
  --card-radius: 5px;
  --flip-duration: 0.45s;
  --flip-easing: cubic-bezier(0.4, 0, 0.2, 1);
  --perspective: 600px;
}

/* ─── 씬 (perspective wrapper) ─── */
.hwatu-scene {
  width: var(--card-w);
  height: var(--card-h);
  perspective: var(--perspective);
  cursor: pointer;
  display: inline-block;
  flex-shrink: 0;
}

/* ─── 카드 본체 ─── */
.hwatu-card {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform var(--flip-duration) var(--flip-easing);
}

/* ─── 뒤집힌 상태 (JS로 클래스 토글) ─── */
.hwatu-card.is-flipped {
  transform: rotateY(180deg);
}

/* ─── 앞면 / 뒷면 공통 ─── */
.hwatu-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: var(--card-radius);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.hwatu-face img {
  width: 100%;
  height: 100%;
  object-fit: fill;    /* 원본 비율 무시하고 카드 틀에 꽉 채움 */
  display: block;
  pointer-events: none;
  user-select: none;
}

/* ─── 뒷면: 미리 180도 뒤집어 놓기 ─── */
.hwatu-back {
  transform: rotateY(180deg);
}

/* ─── 사이즈 변형 유틸 ─── */
.hwatu-scene--lg {
  --card-w: 85px;
  --card-h: 135px;
}

.hwatu-scene--sm {
  --card-w: 51px;
  --card-h: 83px;
}
```

---

## JavaScript

```js
/**
 * 카드 단일 flip
 * @param {HTMLElement} scene - .hwatu-scene 엘리먼트
 * @param {boolean} [faceUp] - true: 앞면, false: 뒷면, undefined: 토글
 */
function flipCard(scene, faceUp) {
  const card = scene.querySelector('.hwatu-card');
  if (!card) return;

  if (faceUp === undefined) {
    card.classList.toggle('is-flipped');
  } else {
    card.classList.toggle('is-flipped', !faceUp);
  }
}

/**
 * 여러 카드 순차 flip (딜링 연출용)
 * @param {NodeList|HTMLElement[]} scenes
 * @param {boolean} faceUp
 * @param {number} delay - 카드 간 딜레이 (ms)
 */
function flipCards(scenes, faceUp, delay = 120) {
  [...scenes].forEach((scene, i) => {
    setTimeout(() => flipCard(scene, faceUp), i * delay);
  });
}

// 클릭 이벤트 바인딩 예시
document.querySelectorAll('.hwatu-scene').forEach(scene => {
  scene.addEventListener('click', () => flipCard(scene));
});
```

---

## React 컴포넌트 (선택)

```tsx
interface HwatuCardProps {
  frontSrc: string;
  backSrc?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  faceUp?: boolean;
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: { width: 51, height: 83 },
  md: { width: 68, height: 110 },
  lg: { width: 85, height: 135 },
};

export function HwatuCard({
  frontSrc,
  backSrc = '/cards/card_back.jpg',
  alt = '화투 카드',
  size = 'md',
  faceUp = true,
  onClick,
}: HwatuCardProps) {
  const { width, height } = SIZE_MAP[size];

  return (
    <div
      style={{ width, height, perspective: 600, cursor: 'pointer', display: 'inline-block' }}
      onClick={onClick}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
          transform: faceUp ? 'rotateY(0deg)' : 'rotateY(180deg)',
        }}
      >
        {/* 앞면 */}
        <div style={faceStyle}>
          <img src={frontSrc} alt={alt} style={imgStyle} />
        </div>
        {/* 뒷면 */}
        <div style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
          <img src={backSrc} alt="뒷면" style={imgStyle} />
        </div>
      </div>
    </div>
  );
}

const faceStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
  borderRadius: 5,
  overflow: 'hidden',
  border: '1px solid rgba(0,0,0,0.15)',
};

const imgStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  pointerEvents: 'none',
  userSelect: 'none',
};
```

---

## 파일 구조 (섯다 기준)

섯다는 1월~10월, 각 월 2장만 사용. 총 20장.

```
/cards/
  card_back.jpg   ← 공통 뒷면 1장
  01-1.png        ← 1월 1번 (솔광)
  01-2.png        ← 1월 2번 (솔띠)
  02-1.png        ← 2월 1번 (매조)
  02-2.png        ← 2월 2번 (매띠)
  03-1.png        ← 3월 1번 (벚꽃광)
  03-2.png        ← 3월 2번 (벚꽃띠)
  04-1.png        ← 4월 1번 (흑싸리)
  04-2.png        ← 4월 2번 (흑싸리띠)
  05-1.png        ← 5월 1번 (난초)
  05-2.png        ← 5월 2번 (난초띠)
  06-1.png        ← 6월 1번 (모란)
  06-2.png        ← 6월 2번 (모란띠)
  07-1.png        ← 7월 1번 (홍싸리)
  07-2.png        ← 7월 2번 (홍싸리띠)
  08-1.png        ← 8월 1번 (공산)
  08-2.png        ← 8월 2번 (공산띠)
  09-1.png        ← 9월 1번 (국진)
  09-2.png        ← 9월 2번 (국띠)
  10-1.png        ← 10월 1번 (단풍광)
  10-2.png        ← 10월 2번 (단풍띠)
```

> 총 20장 + 뒷면 1장. 파일명 규칙: `{월(2자리)}-{번호}.png`

---

## 구현 메모

- `perspective`는 씬(.hwatu-scene)에 걸고, `transform-style: preserve-3d`는 카드 본체에.  
- `backface-visibility: hidden` 없으면 뒷면이 앞면을 비춤.  
- `object-fit: fill`로 원본 비율 무시하고 카드 틀에 꽉 채움. 비율 유지하되 잘림 없이 하려면 `contain`, 잘림 허용하고 비율 유지하려면 `cover`.  
- 딜링 연출이 필요하면 `flipCards()` + CSS `translate` 시작 위치 조합으로 구현 가능.

---

## 섯다 덱 데이터

```js
// 섯다 전용 덱: 1~10월 × 2장 = 20장
const MONTH_NAMES = [
  '솔', '매조', '벚꽃', '흑싸리', '난초',
  '모란', '홍싸리', '공산', '국진', '단풍'
];

const SEOTDA_DECK = Array.from({ length: 10 }, (_, m) => {
  const month = m + 1;
  return [1, 2].map(num => ({
    id: `${String(month).padStart(2, '0')}-${num}`,
    month,
    num,
    name: `${MONTH_NAMES[m]} ${num}번`,
    src: `./cards/${String(month).padStart(2, '0')}-${num}.png`,
  }));
}).flat();
// → 총 20장

// Fisher-Yates 셔플
function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// 사용 예시: 플레이어 2명에게 2장씩 딜
function deal(deck, players = 2, cardsEach = 2) {
  const shuffled = shuffle(deck);
  return Array.from({ length: players }, (_, i) =>
    shuffled.slice(i * cardsEach, (i + 1) * cardsEach)
  );
}
```
