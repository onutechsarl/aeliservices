import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, ChevronDown } from 'lucide-react'

const faqData = [
  {
    id: 1,
    question: "Comment puis-je m'inscrire sur AELI Services App en tant que prestataire ?",
    answer: (
      <>
        L'inscription se fait en 3 étapes simples et c'est gratuit :<br />
        - Étape 1 : Cliquer sur l'icône de votre profil sur la page d'accueil<br />
        - Étape 2 : Rendez vous au bas de page de votre Profil et cliquer sur "devenir prestataire"<br />
        - Étape 3 : Renseigner vos informations puis confirmer. Et c'est parti pour une nouvelle expérience.
      </>
    ),
  },
  {
    id: 2,
    question: "Comment trouver un prestataire près de chez moi ?",
    answer:
      "Activez la géolocalisation sur votre appareil. La plateforme détecte automatiquement votre position et affiche les prestataires disponibles dans votre zone, avec leurs services, photos et tarifs.",
  },
  {
    id: 3,
    question: "Comment optimiser mon profil pour avoir plus de clients ?",
    answer: (
      <>
        Un profil complet = plus de visibilité ! Pensez à :<br />
        - Ajouter votre logo ou photo professionnelle<br />
        - Rédiger une description claire et impactante<br />
        - Lister tous vos services avec des images<br />
        - Indiquer vos prix
      </>
    ),
  },
  {
    id: 4,
    question: "Comment contacter un prestataire ou comment me fait-on contacter en tant que prestataire ?",
    answer: (
      <ul className="list-disc pl-4 space-y-1">
        <li>Rendez vous sur la barre de recherche</li>
        <li>Trouver votre prestataire en fonction de votre besoin</li>
        <li>Une fois le prestataire trouvé, cliquez sur son profil puis sur « Contacter ». Vous échangez directement via la messagerie intégrée pour convenir des détails de votre service.</li>
      </ul>
    ),
  },
  {
    id: 5,
    question: "J'ai besoin d'aide, comment joindre l'équipe AELI Services ?",
    answer: (
      <>
        Notre équipe est disponible pour vous accompagner !<br />
        - (+237) 683 38 41 69<br />
        - (+226) 03 11 88 88<br />
        Ou écrivez-nous directement via ce chat. Nous vous répondons dans les plus brefs délais.
      </>
    ),
  },
]

function AccordionItem({ item, isOpen, onClick }) {
  return (
    <div className="border-b border-gray-200/60 last:border-0">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-4 px-5 text-left focus:outline-none focus-visible:bg-gray-100 transition-colors hover:bg-gray-100/50"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {/* Retour au gris d'origine (fill-gray-500) */}
          <HelpCircle className="w-[22px] h-[22px] fill-gray-500 text-white flex-shrink-0" />
          <span className="font-medium text-gray-700 text-sm sm:text-base">
            {item.question}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-5 px-5 pl-[54px] text-gray-500 text-sm sm:text-base leading-relaxed">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  const [openId, setOpenId] = useState(0)

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
        <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Questions fréquemment <br /> posées
        </h2>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
          Vous avez des interrogations ? Nous avons rassemblé ici les réponses aux questions les plus courantes pour vous accompagner dans votre expérience AELI Services.
        </p>
      </div>

      <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-8">
          <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Encore des questions ?
          </h3>
          <p className="mt-4 text-gray-500 text-sm sm:text-base leading-relaxed">
            Vous n'avez pas trouvé la réponse que vous cherchiez ? Notre équipe est à votre
            disposition pour vous éclairer et vous accompagner dans votre projet.
          </p>
          <a
            href="https://wa.me/237683384169"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full sm:w-auto"
          >
            <button className="flex items-center justify-center gap-2 mt-8 px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-md transition-colors  w-full sm:w-auto shadow-sm">
              <svg height="20" width="20" viewBox="0 0 432 432" xmlns="http://www.w3.org/2000/svg">
                <path d="M364.5 65Q427 127 427 214.5T364.5 364T214 426q-54 0-101-26L0 429l30-109Q2 271 2 214q0-87 62-149T214 3t150.5 62zM214 390q73 0 125-51.5T391 214T339 89.5T214 38T89.5 89.5T38 214q0 51 27 94l4 6l-18 65l67-17l6 3q42 25 90 25zm97-132q9 5 10 7q4 6-3 25q-3 8-15 15.5t-21 9.5q-18 2-33-2q-17-6-30-11q-8-4-15.5-8.5t-14.5-9t-13-9.5t-11.5-10t-10.5-10.5t-8.5-9.5t-7-8.5t-5.5-7t-3.5-5L128 222q-22-29-22-55q0-24 19-44q6-7 14-7q6 0 10 1q8 0 12 9q2 3 6 13l7 17.5l3 8.5q3 5 1 9q-3 7-5 9l-3 3l-3 3.5l-2 2.5q-6 6-3 11q13 22 30 37q13 11 43 26q7 3 11-1q12-15 17-21q4-6 12-3q6 3 36 17z" fill="currentColor" />
              </svg>
              Contactez notre support
            </button>
          </a>
        </div>

        <div className="lg:col-span-8 w-full">
          <div className="bg-[#f8f9fa] border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            {faqData.map((item) => (
              <AccordionItem
                key={item.id}
                item={item}
                isOpen={openId === item.id}
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}