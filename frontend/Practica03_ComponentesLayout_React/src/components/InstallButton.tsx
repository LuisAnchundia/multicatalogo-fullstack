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
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = () => setInstalled(displayMode.matches);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    displayMode.addEventListener('change', onDisplayModeChange);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      displayMode.removeEventListener('change', onDisplayModeChange);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (prompt) {
      try {
        await prompt.prompt();
        await prompt.userChoice;
      } catch {
        setShowHelp(true);
      } finally {
        // El navegador solo permite usar cada aviso una vez, incluso si se cancela.
        setPrompt(null);
      }
    } else {
      setShowHelp((visible) => !visible);
    }
  };

  return <div className="mc-install-wrap">
    <button type="button" className="mc-install-button" onClick={install} aria-expanded={showHelp}>
      {prompt ? 'Instalar app' : '¿Cómo instalar?'}
    </button>
    {showHelp && <div role="dialog" aria-label="Cómo instalar MultiCatálogo" className="mc-install-help">
      <strong>Instala MultiCatálogo</strong>
      <p>En Chrome o Edge, abre el menú del navegador y elige «Instalar aplicación». En iPhone, abre Safari, toca Compartir y luego «Añadir a pantalla de inicio».</p>
      <button type="button" onClick={() => setShowHelp(false)}>Entendido</button>
    </div>}
  </div>;
}
