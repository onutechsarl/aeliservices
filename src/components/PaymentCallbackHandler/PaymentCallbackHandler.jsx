import { Check, X, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../ui/Button';

export function PaymentCallbackHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    const status = searchParams.get('status'); // 'complete', 'pending', ou autre (ex: 'canceled')

    // Configuration des états
    const getStatusConfig = () => {
        if (status === 'complete') {
            return {
                icon: <Check className="w-10 h-10 text-green-600" strokeWidth={3} />,
                bg: 'bg-green-100',
                title: 'Paiement réussi !',
                msg: 'Votre transaction a été traitée avec succès.'
            };
        }
        if (status === 'pending') {
            return {
                icon: <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" strokeWidth={3} />,
                bg: 'bg-yellow-100',
                title: 'Paiement en attente',
                msg: 'Votre paiement est en cours de traitement. Veuillez patienter...'
            };
        }
        return {
            icon: <X className="w-10 h-10 text-red-600" strokeWidth={3} />,
            bg: 'bg-red-100',
            title: status ? `Paiement ${status}` : 'Paiement inconnu',
            msg: 'Une erreur ou une annulation est survenue lors du processus.'
        };
    };

    const config = getStatusConfig();

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center z-2">
            {/* Icône */}
            <div className={`mx-auto w-20 h-20 flex items-center justify-center rounded-full mb-6 ${config.bg}`}>
                {config.icon}
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">{config.title}</h1>
            <p className="text-gray-500 mb-8">{config.msg}</p>

            {/* Bloc d'informations */}
            <div className="bg-gray-50 p-4 rounded-lg text-left mb-8 space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Référence :</span>
                    <span className="font-medium text-gray-900 truncate ml-2">{trxref || 'N/A'}</span>
                </div>
                {/* On affiche le Transaction ID tout le temps */}
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Transaction ID :</span>
                    <span className="font-mono text-gray-900 text-xs mt-1 truncate ml-2">
                        {reference || 'N/A'}
                    </span>
                </div>
            </div>

            {/* Bouton d'action */}
            <Button
                onClick={() => status === 'pending' ? window.location.reload() : navigate('/home')}
                type="button"
                variant="gradient"
                className="w-full gap-2 py-3"
            >
                {status === 'pending' ? 'Actualiser le statut' : 'Retour à l\'accueil'}
            </Button>
        </div>

    );
}
