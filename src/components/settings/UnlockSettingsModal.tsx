import { useState, useEffect } from 'react';
import { UNLOCK_PASSPHRASE } from '@/types/settings';

interface UnlockSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => Promise<void>;
}

export function UnlockSettingsModal({ isOpen, onClose, onUnlock }: UnlockSettingsModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear input and error when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setError(null);
      setIsUnlocking(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatch = inputValue === UNLOCK_PASSPHRASE;

  const handleUnlock = async () => {
    if (!isMatch) return;

    setIsUnlocking(true);
    setError(null);

    try {
      await onUnlock();
      onClose(); // Only close after successful unlock
    } catch (err) {
      console.error('Failed to unlock settings:', err);
      setError('Failed to unlock settings. Please try again.');
      setIsUnlocking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => { if (!isUnlocking) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-settings-title"
        aria-describedby="unlock-settings-description"
        className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lock icon */}
        <div className="flex justify-center mb-4">
          <svg className="w-12 h-12 text-red-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C9.24 2 7 4.24 7 7v3H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm1.5 14.5v2h-3v-2H9l3-3 3 3h-1.5zm1.5-4.5H9V7c0-1.66 1.34-3 3-3s3 1.34 3 3v5z" />
          </svg>
        </div>

        <h2 id="unlock-settings-title" className="text-lg font-bold text-center text-gray-900 mb-2">
          Unlock Settings?
        </h2>

        <p id="unlock-settings-description" className="text-sm text-gray-600 text-center mb-4">
          Changing limits means you're giving up on discipline. Type the phrase below to confirm you're okay with that.
        </p>

        <p className="text-xs font-mono text-red-600 text-center mb-4 bg-red-50 py-2 px-3 rounded-lg select-all break-all">
          {UNLOCK_PASSPHRASE}
        </p>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isMatch && !isUnlocking) {
              e.preventDefault();
              handleUnlock();
            }
          }}
          placeholder="Type the phrase..."
          className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400"
          autoFocus
          disabled={isUnlocking}
        />

        {error && (
          <p className="text-xs text-red-600 mt-2 text-center">{error}</p>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={isUnlocking}
            className="flex-1 min-h-[44px] px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Keep Locked
          </button>
          <button
            onClick={handleUnlock}
            disabled={!isMatch || isUnlocking}
            className="flex-1 min-h-[44px] px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isUnlocking ? 'Unlocking...' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
