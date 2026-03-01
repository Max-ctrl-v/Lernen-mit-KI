import { UI, formatBirthday } from '../utils/strings';

export default function AllergyCard({ card }) {
  const allergies = JSON.parse(card.allergies || '[]');

  return (
    <div
      className="max-w-lg w-full mx-auto rounded-2xl overflow-hidden"
      style={{
        background: '#fffcf0',
        boxShadow: '0 2px 4px rgba(139,105,20,0.1), 0 8px 24px rgba(139,105,20,0.08), 0 0 0 1px rgba(139,105,20,0.15)',
      }}
    >
      {/* Header band */}
      <div
        className="relative text-center py-2.5 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #8b6914 0%, #6b4f10 50%, #8b6914 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{ filter: 'url(#grain)' }} />
        <span className="relative font-display text-sm text-amber-100 uppercase tracking-widest">
          Allergieausweis
        </span>
      </div>

      <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Photo + Name (mobile: side by side, desktop: photo only) */}
        <div className="flex sm:block items-center gap-4 sm:flex-shrink-0">
          <div className="relative rounded-xl overflow-hidden flex-shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(139,105,20,0.15), 0 0 0 1px rgba(139,105,20,0.1)' }}
          >
            <img
              src={card.photoUrl}
              alt={card.name}
              className="w-20 h-20 sm:w-28 sm:h-28 object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(107,79,16,0.15), transparent 40%)' }} />
          </div>
          {/* Name shown next to photo on mobile only */}
          <div className="sm:hidden">
            <div className="font-bold text-base text-gray-900">{card.name}</div>
            <div className="text-xs text-amber-800/70 uppercase tracking-wide">{formatBirthday(card.birthDay, card.birthMonth)}</div>
          </div>
        </div>

        {/* Fields */}
        <div className="flex-1 space-y-1.5 sm:space-y-2 text-sm font-body">
          <Field label={UI.name} value={card.name} bold className="hidden sm:flex" />
          <Field label={UI.birthday} value={formatBirthday(card.birthDay, card.birthMonth)} className="hidden sm:flex" />
          <Field label={UI.medication} value={card.medication ? UI.yes : UI.no} />
          <Field label={UI.bloodType} value={card.bloodType} highlight />
          <Field
            label={UI.allergies}
            value={allergies.length > 0 ? allergies.join(', ') : UI.noAllergies}
          />
          <Field label={UI.idNumber} value={card.idNumber} mono />
          <Field label={UI.country} value={card.country} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, bold, highlight, mono, className = '' }) {
  return (
    <div className={`flex items-baseline ${className}`}>
      <span className="text-amber-800/70 font-medium w-[7rem] sm:w-[10.5rem] flex-shrink-0 text-xs uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-gray-900 min-w-0 break-words ${
        bold ? 'font-bold text-base' :
        highlight ? 'font-bold text-amber-900' :
        mono ? 'font-mono font-semibold tracking-wider text-[13px]' :
        'font-semibold'
      }`}>
        {value}
      </span>
    </div>
  );
}
