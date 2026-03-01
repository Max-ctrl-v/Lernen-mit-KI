import { useState } from 'react';
import AllergyCard from './AllergyCard';
import { UI } from '../utils/strings';

export default function CardCarousel({ cards }) {
  const [current, setCurrent] = useState(0);

  const goTo = (idx) => setCurrent(Math.max(0, Math.min(idx, cards.length - 1)));

  return (
    <div className="space-y-5">
      {/* Card indicator */}
      <div className="text-center">
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-body">
          {UI.card} {current + 1} {UI.of} {cards.length}
        </span>
      </div>

      {/* Card display */}
      <AllergyCard card={cards[current]} />

      {/* Navigation */}
      <div className="flex items-center justify-center gap-5">
        <button
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="btn-secondary px-5 py-2.5 text-sm disabled:opacity-40"
        >
          {UI.previous}
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-full active:scale-90 transition-transform duration-150"
            >
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  i === current ? 'scale-125' : 'hover:bg-gray-400'
                }`}
                style={
                  i === current
                    ? { background: 'linear-gradient(135deg, #14bd6e, #099958)', boxShadow: '0 0 6px rgba(20,189,110,0.4)' }
                    : { background: '#d1d5db' }
                }
              />
            </button>
          ))}
        </div>

        <button
          onClick={() => goTo(current + 1)}
          disabled={current === cards.length - 1}
          className="btn-secondary px-5 py-2.5 text-sm disabled:opacity-40"
        >
          {UI.next}
        </button>
      </div>
    </div>
  );
}
