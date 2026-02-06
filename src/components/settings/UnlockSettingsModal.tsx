import { useState, useEffect } from 'react';
import { UNLOCK_PASSPHRASE } from '@/types/settings';

interface UnlockSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

export function UnlockSettingsModal({ isOpen, onClose, onUnlock }: UnlockSettingsModalProps) {
  const [inputValue, setInputValue] = useState('');

  // Clear input when modal opens/closes
  useEffect(() => {
    if (!isOpen) setInputValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatch = inputValue === UNLOCK_PASSPHRASE;

  const handleUnlock = () => {
    if (isMatch) {
      onUnlock();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lock icon */}
        <div className="flex justify-center mb-4">
          <svg className="w-12 h-12 text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C9.24 2 7 4.24 7 7v3H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm1.5 14.5v2h-3v-2H9l3-3 3 3h-1.5zm1.5-4.5H9V7c0-1.66 1.34-3 3-3s3 1.34 3 3v5z" />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-center text-gray-900 mb-2">
          Unlock Settings?
        </h2>

        <p className="text-sm text-gray-600 text-center mb-4">
          Changing limits means you're giving up on discipline. Type the phrase below to confirm you're okay with that.
        </p>

        <p className="text-xs font-mono text-red-600 text-center mb-4 bg-red-50 py-2 px-3 rounded-lg select-all break-all">
          {UNLOCK_PASSPHRASE}
        </p>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type the phrase..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400"
          autoFocus
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Keep Locked
          </button>
          <button
            onClick={handleUnlock}
            disabled={!isMatch}
            className="flex-1 min-h-[44px] px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}
