import { useEffect, useState } from 'react';
import { useLocation } from "react-router-dom";
import { Button } from '../../ui/Button';

export function InstallBanner() {
    const location = useLocation();
    const isLoginPage = location.pathname.startsWith("/login");

    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isShown, setIsShown] = useState(false);
    const [showIosInstruction, setShowIosInstruction] = useState(false);
    // État pour détecter si l'app est déjà en mode PWA
    const [isStandalone, setIsStandalone] = useState(false);

    // Détection si c'est un appareil iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // 1. Logique de détection PWA
    useEffect(() => {
        const detectStandalone = () => {
            const mediaStandalone = window.matchMedia?.("(display-mode: standalone)").matches;
            const navigatorStandalone = window.navigator.standalone;
            const standalone = Boolean(mediaStandalone || navigatorStandalone);

            setIsStandalone(standalone);
            if (standalone) {
                setIsShown(false);
            }
        };

        detectStandalone();

        const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
        mediaQuery?.addEventListener("change", detectStandalone);
        window.addEventListener("appinstalled", detectStandalone);

        return () => {
            mediaQuery?.removeEventListener("change", detectStandalone);
            window.removeEventListener("appinstalled", detectStandalone);
        };
    }, []);

    // 2. Logique d'affichage de la bannière
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsShown(true);
        };

        if (isIOS) {
            setIsShown(true);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, [isIOS]);

    const handleInstallAction = async () => {
        if (isIOS) {
            setShowIosInstruction(!showIosInstruction);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setIsShown(false);
        }
    };

    // La condition ci-dessous masque tout si on est déjà en standalone
    if (!isShown || !isLoginPage || isStandalone) return null;

    return (
        <div className="fixed md:w-[450px] top-4 left-4 md:left-auto right-4 z-[9999] flex flex-col gap-2">
            {/* La Bannière principale */}
            <div className="bg-white p-4 rounded-2xl shadow-2xl border border-purple-100 flex items-center justify-between animate-bounce">
                <div>
                    <p className="font-bold text-gray-900">AELI Services</p>
                    <p className="text-sm text-gray-600">
                        {isIOS ? "Installez l'app sur votre iPhone" : "Accès rapide sur votre écran"}
                    </p>
                </div>
                <Button
                    variant="softRed"
                    type="button"
                    onClick={handleInstallAction}
                    className="sm:w-auto px-4 py-3"
                >
                    {isIOS ? (showIosInstruction ? "Fermer" : "Installer") : "Installer"}
                </Button>
            </div>

            {/* Bulle d'instruction spécifique à l'iPhone */}
            {isIOS && showIosInstruction && (
                <div className="bg-white text-gray-600 p-4 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-sm font-medium">
                        1. Cliquez sur le bouton <span className="font-bold">Partager</span> (le carré avec une flèche en bas de l'écran).
                    </p>
                    <p className="text-sm font-medium mt-2">
                        2. Faites défiler et appuyez sur <span className="font-bold">"Sur l'écran d'accueil"</span>.
                    </p>
                    <div className="absolute -top-2 right-10 w-4 h-4 bg-gray-700 rotate-45"></div>
                </div>
            )}
        </div>
    );
}