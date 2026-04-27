import React from 'react'
import { FileText, CheckCircle2, ShieldCheck } from 'lucide-react'
import { SectionHeader } from '../../ui/SectionHeader'

/**
 * Section des Conditions Générales d'Utilisation (CGU)
 * Retranscription intégrale des 17 points de la plateforme AELI.
 */
export function TermsSection({ agreed, onToggle }) {
    return (
        <section className="max-w-5xl mx-auto space-y-6">
            <SectionHeader
                icon={FileText}
                title="Cadre Contractuel"
                colorClass="text-[#E8524D]"
            />

            <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                        <ShieldCheck size={18} className="text-[#E8524D] flex-shrink-0" />
                        Conditions Générales d’Utilisation
                    </h3>
                    <span className="hidden md:block text-[10px] bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-full font-bold">
                        PLATEFORME AELI
                    </span>
                </div>
                <div className="max-h-[550px] overflow-y-auto p-8 bg-white scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="space-y-10 text-gray-700">

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">1. PRÉAMBULE</h4>
                            <p className="text-xs leading-relaxed">
                                Les présentes Conditions Générales d’Utilisation (CGU) régissent l’accès et l’utilisation de la plateforme digitale AELI, accessible via application mobile et/ou site web.<br /><br />
                                En accédant à la plateforme, tout utilisateur reconnaît avoir pris connaissance des présentes CGU et les accepter sans réserve.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">2. DÉFINITIONS</h4>
                            <ul className="text-xs space-y-2 list-disc pl-5">
                                <li><strong>AELI :</strong> plateforme digitale de mise en relation entre prestataires et clients</li>
                                <li><strong>Utilisateur :</strong> toute personne inscrite sur la plateforme</li>
                                <li><strong>Prestataire :</strong> utilisateur proposant des services</li>
                                <li><strong>Client :</strong> utilisateur recherchant un service</li>
                                <li><strong>Plateforme :</strong> application AELI</li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">3. OBJET DE LA PLATEFORME</h4>
                            <p className="text-xs leading-relaxed">
                                AELI est une plateforme permettant :<br />
                                • aux prestataires de présenter leurs services<br />
                                • aux clients de rechercher et contacter des prestataires<br /><br />
                                AELI agit exclusivement comme intermédiaire technique de mise en relation.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">4. ACCÈS À LA PLATEFORME</h4>
                            <p className="text-xs leading-relaxed">
                                L’accès à la plateforme est ouvert à toute personne disposant de la capacité juridique.<br /><br />
                                L’inscription nécessite :<br />
                                • la création d’un compte<br />
                                • la fourniture d’informations exactes et complètes<br /><br />
                                L’utilisateur est responsable de la confidentialité de ses identifiants.
                            </p>
                        </section>

                        <section className="p-5 bg-red-50 rounded-xl border border-red-100">
                            <h4 className="text-sm font-bold text-red-900 mb-3">5. RÔLE ET RESPONSABILITÉ DE AELI</h4>
                            <p className="text-xs leading-relaxed text-red-800">
                                AELI :<br />
                                • ne fournit aucun service proposé sur la plateforme<br />
                                • ne garantit pas la qualité, la fiabilité ou la conformité des prestations<br />
                                • n’intervient pas dans la relation contractuelle entre client et prestataire<br /><br />
                                En conséquence, AELI ne saurait être tenue responsable :<br />
                                • des prestations réalisées<br />
                                • des litiges entre utilisateurs<br />
                                • des pertes financières ou dommages liés à une prestation
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">6. OBLIGATIONS DES PRESTATAIRES</h4>
                            <p className="text-xs leading-relaxed">
                                Le prestataire s’engage à :<br />
                                • proposer des services réels, licites et conformes à leur description<br />
                                • fournir des informations exactes sur son activité<br />
                                • respecter la réglementation en vigueur<br />
                                • adopter un comportement professionnel<br /><br />
                                Il est seul responsable :<br />
                                • de ses prestations<br />
                                • des engagements pris envers les clients<br />
                                • de ses obligations fiscales, sociales et administratives<br /><br />
                                Toute activité illégale ou trompeuse entraîne la suspension immédiate du compte.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">7. OBLIGATIONS DES CLIENTS</h4>
                            <p className="text-xs leading-relaxed">
                                Le client s’engage à :<br />
                                • utiliser la plateforme de manière légale<br />
                                • respecter les prestataires<br />
                                • ne pas détourner les services de la plateforme<br /><br />
                                Le client est seul responsable :<br />
                                • du choix du prestataire<br />
                                • des engagements contractuels pris avec celui-ci.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">8. MISE EN RELATION</h4>
                            <p className="text-xs leading-relaxed">
                                La plateforme AELI facilite uniquement la mise en relation.<br /><br />
                                AELI ne garantit pas :<br />
                                • la conclusion d’un contrat<br />
                                • la satisfaction du client<br />
                                • la disponibilité du prestataire<br /><br />
                                Toute prestation est conclue en dehors de la responsabilité de AELI.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">9. SYSTÈME D’ABONNEMENT</h4>
                            <p className="text-xs leading-relaxed">
                                L’inscription est gratuite. Cependant, certaines fonctionnalités sont limitées sans abonnement.<br /><br />
                                Les offres payantes permettent d’accéder à des fonctionnalités avancées, notamment :<br />
                                • augmentation de visibilité<br />
                                • accès direct aux contacts<br />
                                • mise en avant<br /><br />
                                Les modalités des offres sont détaillées dans une section spécifique de la plateforme.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">10. PAIEMENT</h4>
                            <p className="text-xs leading-relaxed">
                                Les abonnements sont payables selon les moyens proposés sur la plateforme.<br /><br />
                                Tout abonnement :<br />
                                • est dû dès sa souscription<br />
                                • n’est pas remboursable sauf décision exceptionnelle de AELI.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">11. SUSPENSION ET RÉSILIATION</h4>
                            <p className="text-xs leading-relaxed">
                                AELI se réserve le droit de suspendre ou supprimer un compte sans préavis en cas de :<br />
                                • non-respect des CGU<br />
                                • fraude ou tentative de fraude<br />
                                • comportement nuisible à la plateforme ou aux utilisateurs.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">12. CONTENUS PUBLIÉS</h4>
                            <p className="text-xs leading-relaxed">
                                Les utilisateurs sont responsables des contenus qu’ils publient.<br /><br />
                                Il est interdit de publier :<br />
                                • des contenus faux ou trompeurs<br />
                                • des contenus illégaux<br />
                                • des contenus portant atteinte à autrui<br /><br />
                                AELI se réserve le droit de supprimer tout contenu non conforme.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">13. PROPRIÉTÉ INTELLECTUELLE</h4>
                            <p className="text-xs leading-relaxed">
                                Tous les éléments de la plateforme AELI (textes, visuels, design, marque) sont protégés.<br />
                                Toute reproduction ou utilisation non autorisée est interdite.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">14. DONNÉES PERSONNELLES</h4>
                            <p className="text-xs leading-relaxed">
                                AELI collecte des données nécessaires au fonctionnement de la plateforme.<br />
                                Les données sont :<br />
                                • utilisées uniquement dans ce cadre<br />
                                • protégées conformément aux réglementations applicables.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">15. LIMITATION DE RESPONSABILITÉ</h4>
                            <p className="text-xs leading-relaxed">
                                AELI ne peut être tenue responsable :<br />
                                • des interruptions de service<br />
                                • des erreurs techniques<br />
                                • des dommages indirects liés à l’utilisation de la plateforme.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-black mb-3">16. MODIFICATION DES CGU</h4>
                            <p className="text-xs leading-relaxed">
                                AELI se réserve le droit de modifier les présentes CGU à tout moment.<br />
                                Les utilisateurs seront informés des mises à jour.
                            </p>
                        </section>

                        <section className="pb-6 border-b border-slate-100">
                            <h4 className="text-sm font-bold text-black mb-3 italic underline">17. DROIT APPLICABLE</h4>
                            <p className="text-xs leading-relaxed font-semibold text-slate-800 italic">
                                Les présentes CGU sont régies par le droit camerounais. Tout litige sera soumis aux juridictions compétentes du Cameroun.
                            </p>
                        </section>
                    </div>
                </div>
                <div className="bg-slate-50 p-8 border-t border-slate-100">
                    <div className="flex items-start gap-4">
                        <div className="relative mt-1">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => onToggle(e.target.checked)}
                                className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-slate-300 checked:bg-[#E8524D] checked:border-[#E8524D] transition-all duration-300 "
                            />
                            <CheckCircle2
                                className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                                size={16}
                            />
                        </div>
                        <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer select-none leading-relaxed">
                            Je confirme avoir lu et j'accepte sans réserve les <span className="font-bold text-black">17 articles des Conditions Générales d’Utilisation</span> de la plateforme AELI.<br />
                            <span className="text-[11px] text-slate-500 italic font-medium">Cette acceptation constitue une signature numérique légale de votre part.</span>
                        </label>
                    </div>
                </div>
            </div>
        </section>
    )
}