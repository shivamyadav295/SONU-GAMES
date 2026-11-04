import React, { useId } from 'react';

export const MoveIllustration = ({ move, className = '' }) => {
  const gradientId = useId().replace(/:/g, '');
  const gradients = {
    rock: {
      base: `rock-base-${gradientId}`,
      face: `rock-face-${gradientId}`,
    },
    paper: {
      base: `paper-base-${gradientId}`,
      face: `paper-face-${gradientId}`,
    },
    scissors: {
      blade: `scissors-blade-${gradientId}`,
      handle: `scissors-handle-${gradientId}`,
    },
  };

  if (move === 'rock') {
    return (
      <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradients.rock.base} x1="20" y1="12" x2="61" y2="72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C5C9C4" />
            <stop offset=".48" stopColor="#858D88" />
            <stop offset="1" stopColor="#59635F" />
          </linearGradient>
          <linearGradient id={gradients.rock.face} x1="24" y1="20" x2="53" y2="61" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E1E3DF" />
            <stop offset="1" stopColor="#9AA19B" />
          </linearGradient>
        </defs>
        <ellipse cx="40" cy="68" rx="25" ry="5" fill="#45534C" opacity=".16" />
        <path d="m13 43 7-20 15-12 21 3 12 17-3 23-17 13-22-3-15-9 2-12Z" fill={`url(#${gradients.rock.base})`} />
        <path d="m20 23 15-12 8 16-10 14-20 2 7-20Z" fill={`url(#${gradients.rock.face})`} />
        <path d="m35 11 21 3 12 17-25-4-8-16Z" fill="#D7DAD5" opacity=".82" />
        <path d="m33 41 10-14 25 4-3 23-17 13-6-15-9-11Z" fill="#727C76" opacity=".8" />
        <path d="m13 43 20-2 9 11 7 15-22-3-15-9 1-12Z" fill="#67716B" />
        <path d="m18 27 5-4m-1 27 8 8m25-34 7 7" stroke="#F2F3F0" strokeLinecap="round" strokeWidth="2" opacity=".55" />
      </svg>
    );
  }

  if (move === 'paper') {
    return (
      <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradients.paper.base} x1="18" y1="10" x2="62" y2="72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF" />
            <stop offset=".68" stopColor="#F4F7F5" />
            <stop offset="1" stopColor="#D8E0DC" />
          </linearGradient>
          <linearGradient id={gradients.paper.face} x1="55" y1="10" x2="66" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E3EAE6" />
            <stop offset="1" stopColor="#BCCBC4" />
          </linearGradient>
        </defs>
        <ellipse cx="41" cy="69" rx="23" ry="4" fill="#687A71" opacity=".16" />
        <path d="M22 9h26l16 16v39a5 5 0 0 1-5 5H22a5 5 0 0 1-5-5V14a5 5 0 0 1 5-5Z" fill="#B8C5BF" opacity=".65" transform="translate(2 3)" />
        <path d="M22 8h26l16 16v40a5 5 0 0 1-5 5H22a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5Z" fill={`url(#${gradients.paper.base})`} stroke="#D3DDD8" strokeWidth="1.5" />
        <path d="M48 8v12a4 4 0 0 0 4 4h12L48 8Z" fill={`url(#${gradients.paper.face})`} />
        <path d="M48 8v12a4 4 0 0 0 4 4h12" stroke="#CFD9D4" strokeWidth="1.5" />
        <path d="M27 37h30M27 45h26M27 53h21" stroke="#8CB6A5" strokeLinecap="round" strokeWidth="3" opacity=".8" />
        <path d="M23 13h20" stroke="#FFF" strokeLinecap="round" strokeWidth="2" opacity=".85" />
      </svg>
    );
  }

  if (move === 'scissors') {
    return (
      <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradients.scissors.blade} x1="22" y1="10" x2="56" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF" />
            <stop offset=".42" stopColor="#CFD9D5" />
            <stop offset="1" stopColor="#82938C" />
          </linearGradient>
          <linearGradient id={gradients.scissors.handle} x1="19" y1="43" x2="61" y2="74" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F6C879" />
            <stop offset=".55" stopColor="#D99C45" />
            <stop offset="1" stopColor="#A9682C" />
          </linearGradient>
        </defs>
        <ellipse cx="40" cy="69" rx="25" ry="4" fill="#715735" opacity=".16" />
        <path d="m37 39-22-27a4 4 0 0 1 6-5l27 25-11 7Z" fill={`url(#${gradients.scissors.blade})`} stroke="#8B9A94" strokeWidth="1.3" />
        <path d="m43 39 22-27a4 4 0 0 0-6-5L32 32l11 7Z" fill={`url(#${gradients.scissors.blade})`} stroke="#8B9A94" strokeWidth="1.3" />
        <path d="m37 39-18 25" stroke={`url(#${gradients.scissors.handle})`} strokeWidth="8" strokeLinecap="round" />
        <path d="m43 39 18 25" stroke={`url(#${gradients.scissors.handle})`} strokeWidth="8" strokeLinecap="round" />
        <circle cx="18" cy="64" r="9" fill={`url(#${gradients.scissors.handle})`} stroke="#B77C37" strokeWidth="2" />
        <circle cx="62" cy="64" r="9" fill={`url(#${gradients.scissors.handle})`} stroke="#B77C37" strokeWidth="2" />
        <circle cx="18" cy="64" r="4" fill="#F7F8F5" />
        <circle cx="62" cy="64" r="4" fill="#F7F8F5" />
        <circle cx="40" cy="39" r="5" fill="#D59A4C" stroke="#A97537" strokeWidth="1.5" />
        <circle cx="38.5" cy="37.5" r="1.2" fill="#FFF2D6" />
      </svg>
    );
  }

  return null;
};

export default MoveIllustration;
