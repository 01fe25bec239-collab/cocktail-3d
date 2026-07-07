'use client';

import { useState, useEffect, useRef } from 'react';

export default function AgeGateModal() {
  const [showModal, setShowModal] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Check if user has already verified their age
    const isVerified = localStorage.getItem('ageVerified');
    if (!isVerified) {
      setShowModal(true);
      // Optional: Prevent scrolling while modal is open
      document.body.style.overflow = 'hidden';
    }
  }, []);

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (showModal) confirmRef.current?.focus();
  }, [showModal]);

  const handleConfirm = () => {
    localStorage.setItem('ageVerified', 'true');
    setShowModal(false);
    document.body.style.overflow = 'auto';
  };

  const handleDeny = () => {
    window.location.href = 'https://www.drinkaware.co.uk';
  };

  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-desc"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-8 shadow-2xl text-center">
        <h2 id="age-gate-title" className="text-2xl font-bold text-white mb-4">Age Verification</h2>
        <p id="age-gate-desc" className="text-neutral-300 mb-8 leading-relaxed">
          This website contains information about alcoholic beverages.
          Are you of legal drinking age in your country of residence?
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleDeny}
            className="flex-1 py-3 px-6 rounded-lg font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            No, I am not
          </button>
          <button
            ref={confirmRef}
            onClick={handleConfirm}
            className="flex-1 py-3 px-6 rounded-lg font-bold text-black bg-[#f59e0b] hover:bg-[#d97706] transition-colors"
          >
            Yes, I am
          </button>
        </div>
      </div>
    </div>
  );
}
