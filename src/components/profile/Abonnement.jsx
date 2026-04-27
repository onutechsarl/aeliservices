import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, RefreshCw, ChevronRight, Zap, History as HistoryIcon, ShieldCheck } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { useGetAbonnementProvider } from '../../hooks/useSouscription';

/**
 * UI component responsible for rendering abonnement.
 */
export function Abonnement({ isRole }) {
    const navigate = useNavigate();
    const { data: response } = useGetAbonnementProvider();

    const sub = response?.data?.subscription;
    const planslis = response?.data?.plans;
    const plans = response?.data?.history;
    const planEntries = plans ? Object.entries(plans) : [];

    const planpricesctif = planslis?.[sub?.plan]?.price || 0;
    const planjouractif = planslis?.[sub?.plan]?.days || 0;
    const currentPlanInfo = plans && sub?.plan ? plans[sub.plan] : null;

    const totalDays = currentPlanInfo?.days || 30;
    const progress = sub ? Math.min(100, (sub.daysRemaining / totalDays) * 100) : 0;

    return (
        <div className="h-full flex flex-col gap-6 mt-6">
            <div className="flex flex-col gap-6">
                {isRole === "provider" &&
                    < Card className="overflow-hidden flex flex-col shadow-sm border-slate-100">
                        <div className="p-6 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                        <ShieldCheck size={14} className="text-[#E8524D]" />
                                        Statut du compte
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                        {sub?.isTrial ? 'Période d\'essai' : `Plan ${sub?.plan || '...'}`}
                                    </h2>
                                </div>
                                <Badge variant={sub?.isActive ? "success" : "danger"}>
                                    {sub?.isTrial ? "Essai Gratuit" : sub?.isActive ? "Actif" : "Expiré"}
                                </Badge>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-md border border-slate-100 space-y-4">
                                <div className="flex items-baseline justify-between">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-slate-900">
                                            {planpricesctif}
                                        </span>
                                        <span className="text-sm font-bold text-slate-500">
                                            XAF / {planjouractif} jours
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Restant</p>
                                        <p className="text-lg font-black text-[#E8524D]">{sub?.daysRemaining || 0} j</p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#E8524D] rounded-full transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-md">
                                <div className="p-2 bg-slate-50 rounded-md">
                                    <Calendar size={16} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                        {sub?.isTrial ? "Fin de l'essai le" : "Date d'échéance"}
                                    </p>
                                    <p className="text-sm font-black text-slate-700">
                                        {sub?.endDate ? new Date(sub.endDate).toLocaleDateString('fr-FR', {
                                            day: 'numeric', month: 'long', year: 'numeric'
                                        }) : 'Non définie'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                }
                <Card className="bg-[#1F2937] border-none overflow-hidden flex flex-col shadow-lg">
                    <div className="p-6 flex flex-col h-full space-y-6">
                        <div className="w-10 h-10 bg-amber-400/20 rounded-md flex items-center justify-center">
                            <Zap className="text-amber-400 fill-amber-400" size={20} />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                {isRole !== "provider"
                                    ? "Devenez Prestataire"
                                    : sub?.isTrial
                                        ? "L'essai vous plaît ?"
                                        : "Boostez vos revenus"}
                            </h3>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed">
                                {isRole !== "provider"
                                    ? "Proposez vos services sur AELI et développez votre activité dès aujourd'hui." // Description pour les non-providers
                                    : sub?.isTrial
                                        ? "Profitez de toutes les fonctionnalités premium. Choisissez un plan avant la fin de vos 30 jours pour rester visible."
                                        : "Passez au plan Quarterly ou Yearly pour bénéficier de tarifs réduits sur votre abonnement."
                                }
                            </p>
                        </div>

                        <div className="mt-auto pt-4">
                            <Button
                                variant="gradient"
                                onClick={() => navigate(isRole !== "provider" ? "/become-service-provider" : "/subscription")}
                                className="w-full flex items-center justify-center gap-2 py-4 shadow-xl shadow-orange-500/10 font-black uppercase text-xs"
                            >
                                {isRole !== "provider" ? "Devenir prestataire" : sub?.isTrial ? "S'abonner maintenant" : "Changer de forfait"}
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                </Card>
                {isRole === "provider" &&
                    <Card className="shadow-sm border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-50 flex items-center gap-2 bg-white">
                            <HistoryIcon size={16} className="text-slate-400" />
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">
                                Historique de facturation
                            </h3>
                        </div>
                        <div className={`bg-white divide-y divide-slate-50 ${planEntries.length > 0 ? "" : "p-4"}`}>
                            {planEntries.length > 0 ? (
                                planEntries.map(([planKey, planData]) => (
                                    <div key={planKey} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-900 text-xs font-black uppercase tracking-tight">
                                                Plan {planKey}
                                            </span>
                                            <span className="text-slate-400 text-[10px] font-bold uppercase">
                                                Durée {planData?.days || 0} jours
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <div className="space-y-1">
                                                <Badge
                                                    variant={(planData?.price || 0) > 0 ? "success" : "secondary"}
                                                    className="text-[8px] px-1.5 py-0 uppercase"
                                                >
                                                    {(planData?.price || 0) > 0 ? "Payant" : "Gratuit"}
                                                </Badge>
                                                <p className="text-[9px] font-mono text-slate-400">
                                                    {(planData?.price || 0).toLocaleString()} XAF
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 flex flex-col bg-slate-50 border border-slate-100 rounded-xl items-center justify-center text-center space-y-3">
                                    <div className="p-3 bg-slate-50 rounded-full">
                                        <ShieldCheck size={24} className="text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 text-xs font-medium italic">
                                        Aucune transaction passée trouvée.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                }
            </div>
        </div >
    );
}
