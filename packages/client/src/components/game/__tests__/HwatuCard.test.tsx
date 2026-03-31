import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HwatuCard } from '../HwatuCard';
import { getCardImageSrc } from '@/lib/cardImageUtils';

const card = { rank: 1 as const, attribute: 'gwang' as const };

describe('HwatuCard', () => {
  it('faceUp=true: img src matches getCardImageSrc result', () => {
    render(<HwatuCard card={card} faceUp={true} />);
    const imgs = document.querySelectorAll('img');
    const expectedSrc = getCardImageSrc(card);
    const found = Array.from(imgs).some((img) => img.getAttribute('src') === expectedSrc);
    expect(found).toBe(true);
  });

  it('faceUp=false: card back image is /img/card_back.jpg', () => {
    render(<HwatuCard card={card} faceUp={false} />);
    const imgs = document.querySelectorAll('img');
    const found = Array.from(imgs).some((img) => img.getAttribute('src') === '/img/card_back.jpg');
    expect(found).toBe(true);
  });

  it('size=sm: width 51px and height 83px style', () => {
    const { container } = render(<HwatuCard card={card} faceUp={true} size="sm" />);
    const scene = container.querySelector('.hwatu-scene') as HTMLElement;
    expect(scene.style.width).toBe('51px');
    expect(scene.style.height).toBe('83px');
  });

  it('size=md: width 68px and height 110px style', () => {
    const { container } = render(<HwatuCard card={card} faceUp={true} size="md" />);
    const scene = container.querySelector('.hwatu-scene') as HTMLElement;
    expect(scene.style.width).toBe('68px');
    expect(scene.style.height).toBe('110px');
  });

  it('size=lg: width 85px and height 135px style', () => {
    const { container } = render(<HwatuCard card={card} faceUp={true} size="lg" />);
    const scene = container.querySelector('.hwatu-scene') as HTMLElement;
    expect(scene.style.width).toBe('85px');
    expect(scene.style.height).toBe('135px');
  });

  it('faceUp=true: hwatu-card element has is-flipped class', () => {
    const { container } = render(<HwatuCard card={card} faceUp={true} />);
    const cardEl = container.querySelector('.hwatu-card');
    expect(cardEl?.classList.contains('is-flipped')).toBe(true);
  });

  it('faceUp=false: hwatu-card element does NOT have is-flipped class', () => {
    const { container } = render(<HwatuCard card={card} faceUp={false} />);
    const cardEl = container.querySelector('.hwatu-card');
    expect(cardEl?.classList.contains('is-flipped')).toBe(false);
  });

  it('card=null: only back image shown', () => {
    render(<HwatuCard card={null} faceUp={true} />);
    const imgs = document.querySelectorAll('img');
    const found = Array.from(imgs).some((img) => img.getAttribute('src') === '/img/card_back.jpg');
    expect(found).toBe(true);
  });
});
