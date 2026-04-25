import { Minus, Plus } from 'lucide-react';

const CHIP_STEP = 10000;
const MIN_INITIAL_CHIPS = 10000;

interface InitialChipsStepperProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
}

export function InitialChipsStepper({ id, value, onChange }: InitialChipsStepperProps) {
  const normalizedValue = Number.isFinite(value) ? Math.max(MIN_INITIAL_CHIPS, value) : 100000;
  const canDecrease = normalizedValue > MIN_INITIAL_CHIPS;

  const changeBy = (delta: number) => {
    onChange(Math.max(MIN_INITIAL_CHIPS, normalizedValue + delta));
  };

  return (
    <div className="entry-chip-stepper" aria-labelledby={`${id}-label`}>
      <button
        type="button"
        className="entry-chip-stepper__button"
        onClick={() => changeBy(-CHIP_STEP)}
        disabled={!canDecrease}
        aria-label="Decrease initial chips by 10,000"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div id={id} className="entry-chip-stepper__value" aria-live="polite">
        {normalizedValue.toLocaleString('ko-KR')}
      </div>
      <button
        type="button"
        className="entry-chip-stepper__button"
        onClick={() => changeBy(CHIP_STEP)}
        aria-label="Increase initial chips by 10,000"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
