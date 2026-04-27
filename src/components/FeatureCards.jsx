import React from 'react';
import { BadgeCheckIcon, MessageCircleIcon, MapPinIcon } from 'lucide-react';
import { FeatureCard } from '../ui/FeatureCard';


export function FeatureCards() {
    return (
        <section className="relative  w-full bg-white mt-20 md:mt-25 lg:mt-40 " aria-label="Features">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-12 lg:-mt-16 pb-12 md:pb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                    <FeatureCard
                        icon={BadgeCheckIcon}
                        title="Un annuaire de talents certifiés"
                        description="Parcourez des profils détaillés et vérifiés. Chaque prestataire affiche son expérience, ses réalisations et ses compétences pour vous permettre de choisir en toute confiance."
                    />
                    <FeatureCard
                        icon={MessageCircleIcon}
                        title="Contact direct et sans intermédiaire"
                        description="Pas de processus complexe : une fois l'expert identifié, discutez directement avec lui pour définir vos besoins et obtenir un devis personnalisé, sans délai."
                    />
                    <FeatureCard
                        icon={MapPinIcon}
                        title="Proximité et réactivité garantie"
                        description="Filtrez par localisation pour trouver les meilleurs professionnels dans votre zone géographique. La compétence dont vous avez besoin est juste à côté de chez vous."
                        className="md:col-span-2 lg:col-span-1"
                    />
                </div>
            </div>
        </section>
    )
}
