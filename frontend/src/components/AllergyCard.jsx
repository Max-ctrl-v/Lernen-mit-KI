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

      <div className="p-6 flex gap-6">
        {/* Photo */}
        <div className="flex-shrink-0">
          <div className="relative rounded-xl overflow-hidden"
            style={{ boxShadow: '0 2px 8px rgba(139,105,20,0.15), 0 0 0 1px rgba(139,105,20,0.1)' }}
          >
            <img
              src={card.photoUrl}
              alt={card.name}
              className="w-28 h-28 object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(107,79,16,0.15), transparent 40%)' }} />
          </div>
        </div>

        {/* Fields */}
        <div className="flex-1 space-y-2 text-sm font-body">
          <Field label={UI.name} value={card.name} bold />
          <Field label={UI.birthday} value={formatBirthday(card.birthDay, card.birthMonth)} />
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

function Field({ label, value, bold, highlight, mono }) {
  return (
    <div className="flex items-baseline">
      <span className="text-amber-800/70 font-medium w-[10.5rem] flex-shrink-0 text-xs uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-gray-900 ${
        bold ? 'font-bold text-base' :
        highlight ? 'font-bold text-amber-900' :
        mono ? 'font-mono font-semibold tracking-wider' :
        'font-semibold'
      }`}>
        {value}
      </span>
    </div>
  );
}
