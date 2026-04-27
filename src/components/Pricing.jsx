import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '../ui/Button';


export function Pricing() {
    const featureCategories = [
        {
            name: 'Services Essentiels',
            keys: [
                'Contacts illimités',
                'Accès direct (WhatsApp, tél, email)',
                'Ajout illimité de services'
            ],
        },
        {
            name: 'Visibilité & Marketing',
            keys: [
                'Mises en avant (post ou newsletter)',
                'Durée mise en avant plateforme',
                'Visuels professionnels offerts'
            ],
        },
        {
            name: 'Audit & Avantages',
            keys: [
                'Audit de profil',
                'Priorité résultats de recherche',
                'Accès prioritaire aux opportunités'
            ],
        },
    ]

    const plans = [
        {
            name: 'Mensuel',
            price: '5 000',
            description: 'Abonnement mensuel',
            features: {
                'Contacts illimités': true,
                'Accès direct (WhatsApp, tél, email)': true,
                'Ajout illimité de services': true,
                'Mises en avant (post ou newsletter)': '1',
                'Durée mise en avant plateforme': '7 jours',
                'Visuels professionnels offerts': false,
                'Audit de profil': false,
                'Priorité résultats de recherche': false,
                'Accès prioritaire aux opportunités': false,
            },
            recommanded: false,
        },
        {
            name: 'Trimestriel',
            price: '15 000',
            description: 'Abonnement trimestriel',
            features: {
                'Contacts illimités': true,
                'Accès direct (WhatsApp, tél, email)': true,
                'Ajout illimité de services': true,
                'Mises en avant (post ou newsletter)': '2',
                'Durée mise en avant plateforme': '3 semaines',
                'Visuels professionnels offerts': '1',
                'Audit de profil': 'Mini-audit',
                'Priorité résultats de recherche': false,
                'Accès prioritaire aux opportunités': false,
            },
            recommanded: false,
        },
        {
            name: 'Annuel',
            price: '25 000',
            description: 'Abonnement annuel',
            highlighted: true,
            features: {
                'Contacts illimités': true,
                'Accès direct (WhatsApp, tél, email)': true,
                'Ajout illimité de services': true,
                'Mises en avant (post ou newsletter)': '6',
                'Durée mise en avant plateforme': '8 semaines',
                'Visuels professionnels offerts': '2',
                'Audit de profil': 'Audit approfondi',
                'Priorité résultats de recherche': true,
                'Accès prioritaire aux opportunités': true,
            },
            recommanded: true,
        },
    ]

    return (
        <section className="pb-24 pt-20 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-bold mb-6 text-gray-900">Plans AELI Services</h2>
                </div>
                <div className="flex flex-col lg:flex-row gap-0 border-y border-gray-100 relative">
                    <div className="hidden lg:block mt-51 w-64 shrink-0 py-8 pr-8 border-r border-gray-100">
                        {featureCategories.map((category, idx) => (
                            <div key={idx} className="mb-8">
                                <h4 className="text-gray-900 font-bold text-sm mb-4 uppercase tracking-wider">
                                    {category.name}
                                </h4>
                                <ul className="space-y-4">
                                    {category.keys.map((key, i) => (
                                        <li key={i} className="text-sm text-gray-500 h-6 flex items-center">
                                            {key}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-0">
                        {plans.map((plan, idx) => (
                            <div key={idx} className={`py-8 px-6 lg:px-8 relative ${plan.highlighted ? 'bg-[#8B5CF6]/[0.03] lg:border-x border-[#8B5CF6]/20' : 'lg:border-r border-gray-100'}`}>
                                <div className="h-48 mb-12 flex flex-col justify-between">
                                    <div>
                                        <h3 className={`text-lg font-medium mb-2 ${plan.highlighted ? 'text-[#8B5CF6]' : 'text-gray-900'}`}>
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                            <span className="text-gray-400 text-sm">XAF</span>
                                        </div>
                                    </div>
                                    <a
                                        href="https://app.aeliservices.com">
                                        <Button
                                            variant="plan"
                                            recommanded={plan.recommanded}
                                        >
                                            Choisir ce plan
                                        </Button>
                                    </a>
                                </div>
                                {featureCategories.map((category, catIdx) => (
                                    <div key={catIdx} className="mb-8 lg:mb-17">
                                        <h4 className="text-gray-900 font-bold text-sm mb-4 lg:hidden uppercase">{category.name}</h4>
                                        <ul className="space-y-4">
                                            {category.keys.map((key, i) => (
                                                <li key={i} className="text-sm h-6 flex items-center justify-between lg:justify-start">
                                                    <span className="text-gray-500 lg:hidden">{key}</span>
                                                    <div className="flex items-center gap-2">
                                                        {plan.features[key] === true ? (
                                                            <Check className="w-5 h-5 text-green-500" />
                                                        ) : plan.features[key] === false ? (
                                                            <span className="text-gray-300">-</span>
                                                        ) : (
                                                            <span className="font-semibold text-gray-900">{plan.features[key]}</span>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}