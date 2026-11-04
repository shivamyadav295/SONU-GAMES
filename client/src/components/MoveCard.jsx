import React from 'react';
import soundManager from '../services/sound';
import MoveIllustration from './MoveIllustration';

export const MoveCard = ({
  move,
  label,
  keyNumber,
  selected,
  disabled,
  onClick,
  accentColor = 'cyan', // 'cyan', 'pink', 'amber'
}) => {
  const handleClick = () => {
    if (disabled) return;
    soundManager.playSelect();
    onClick(move);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={selected}
      data-move={move}
      className={`move-card group relative flex-1 flex flex-col items-center justify-center min-h-[88px] p-3 sm:p-4 select-none ${
        selected ? 'is-selected' : ''
      } ${disabled ? 'is-disabled' : ''}`}
    >
      {/* Keyboard Shortcut Chip */}
      <span className="move-card__shortcut">
        [{keyNumber}]
      </span>

      {/* Hand Gesture Icon */}
      <MoveIllustration move={move} className="move-icon-3d move-card__icon" />

      {/* Label */}
      <span className="move-card__label">
        {label}
      </span>

      {/* Subtle Bottom Accent Indicator */}
      <span className="move-card__indicator" aria-hidden="true" />
    </button>
  );
};

export default MoveCard;
