import { useState } from 'react';
import EarnWhileYouLearn from './EarnWhileYouLearn.jsx';

export default function EarnWhileYouLearnLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="ewyl-launcher" onClick={() => setOpen(true)} aria-label="Open Earn While You Learn">
        🚀 Earn While You Learn
      </button>
      {open && (
        <div className="ewyl-overlay" role="dialog" aria-modal="true" aria-label="Earn While You Learn">
          <div className="ewyl-modal">
            <button className="ewyl-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
            <EarnWhileYouLearn showToast={(message) => window.alert(message)} />
          </div>
        </div>
      )}
    </>
  );
}
