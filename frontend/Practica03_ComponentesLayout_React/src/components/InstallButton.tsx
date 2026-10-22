import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setPrompt(null); setShowHelp(false); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') setPrompt(null);
    } else {
      setShowHelp(true);
    }
  };

  return <div className="mc-install-wrap">
    <button type="button" className="mc-install-button" onClick={install}>Instalar app</button>
    {showHelp && <div role="dialog" aria-label="Cómo instalar MultiCatálogo" className="mc-install-help">
      <strong>Instala MultiCatálogo</strong>
      <p>En Chrome o Edge, abre el menú del navegador y elige «Instalar aplicación». En iPhone, abre Safari, toca Compartir y luego «Añadir a pantalla de inicio».</p>
      <button type="button" onClick={() => setShowHelp(false)}>Entendido</button>
    </div>}
  </div>;
}
