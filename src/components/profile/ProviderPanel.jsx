import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Calendar, FileText, MapPin, Pencil } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { useInfoUserConnected } from '../../hooks/useUser';
import { useGetProviderApplication } from '../../hooks/useProvider';

/**
 * UI component responsible for rendering provider panel.
 */
export function ProviderPanel({ onOpenManageDocuments }) {
    const navigate = useNavigate();
    const { data, refetch } = useInfoUserConnected();
    const { data: dataMyapply } = useGetProviderApplication();
    const provider = data?.data?.provider;
    const application = dataMyapply?.data?.application;
    const isPendingApplication = application?.status === 'pending';
    const displayData = isPendingApplication ? application : provider;

    return (
        <div className="h-full">
            <Card className="h-full overflow-hidden flex flex-col shadow-sm border-slate-100">
                <div className="p-6 flex-1 flex flex-col gap-6">
                    <div className="text-center space-y-2">
                        <div className="relative mx-auto w-20 h-20 mb-4">
                            <img
                                src={displayData?.profilePhoto || `./defaultstructure.jpg`}
                                className="w-full h-full rounded-2xl object-cover border-2 border-white shadow-md"
                                alt="Profile"
                            />
                            {/* {provider?.isVerified && (
                                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                                    <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-50" />
                                </div>
                            )} */}
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            {displayData?.businessName || "Mon Entreprise"}
                        </h2>
                        <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider">
                            <MapPin size={12} className="text-[#E8524D]" />
                            <span className="truncate max-w-[200px]">{displayData?.location || 'Yaoundé, Cameroun'}</span>
                        </div>
                    </div>
                    {!isPendingApplication && (
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    Note Globale
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-slate-900">
                                        {parseFloat(provider?.averageRating || 0).toFixed(1)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        ({provider?.totalReviews || 0} avis)
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-3.5 h-3.5 ${star <= Math.round(provider?.averageRating || 0)
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-slate-200 fill-slate-200"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Souscription & Statut</h3>
                        </div>

                        <div className="bg-white rounded-md border border-slate-100 divide-y divide-slate-50">
                            {!isPendingApplication && (
                                <div className="flex items-center justify-between p-3">
                                    <span className="text-slate-500 text-xs font-medium">Visibilité Profile</span>
                                    <Badge variant={provider?.isActive ? "success" : "danger"}>
                                        {provider?.isActive ? "Public" : "Masqué"}
                                    </Badge>
                                </div>
                            )}
                            <div className="flex items-center justify-between p-3">
                                <span className="text-slate-500 text-xs font-medium">Vérification Documents</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold uppercase ${displayData?.verificationStatus === 'approved' || displayData?.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {displayData?.verificationStatus || displayData?.status || 'En attente'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3">
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-xs font-medium">Activités</span>
                                    <div className="flex gap-1 mt-1">
                                        {displayData?.activities?.slice(0, 2).map((act, i) => (
                                            <span key={i} className="flex items-center gap-1 px-3 py-1 bg-[#E8524D]/10 text-[#E8524D] text-[12px] text-center font-medium rounded-full border border-[#E8524D]/20 animate-in zoom-in duration-200">
                                                {act}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {!isPendingApplication && !provider?.isFeatured && (
                            <Alert
                                variant="warning"
                                title="Boostez votre activité"
                                message="Votre profil n'est pas 'Mis en avant'. Passez au plan premium pour apparaître en tête des recherches."
                            />
                        )}
                    </div>
                    {!isPendingApplication && (
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                            <div className="p-3 bg-slate-50 rounded-md border border-slate-100 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Vues</p>
                                <p className="text-lg font-black text-slate-800">{provider?.viewsCount || 0}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-md border border-slate-100 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Contacts</p>
                                <p className="text-lg font-black text-slate-800">{provider?.contactsCount || 0}</p>
                            </div>
                        </div>
                    )}
                    {!isPendingApplication && (
                        <Button
                            type="button"
                            variant="softRed"
                            className="w-full gap-2 py-3"
                            onClick={() => navigate('/become-service-provider')}
                        >
                            <Pencil size={16} />
                            Modifier
                        </Button>
                    )}
                    <div className="flex w-full justify-center">
                        <button
                            type="button"
                            onClick={onOpenManageDocuments}
                            className="flex gap-3 text-[10px] font-bold text-[#E8524D] uppercase text-center"
                        >
                            <FileText size={16} />
                            Mes documents
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
