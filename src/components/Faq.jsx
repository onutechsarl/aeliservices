import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, ChevronDown } from 'lucide-react'

const faqData = [
  {
    id: 1,
    question: 'Lorem ipsum dolor sit amet adipisicing?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Consequatur quidem eius cum voluptatum quasi delectus assumenda culpa.',
  },
  {
    id: 2,
    question: 'Lorem ipsum dolor sit amet adipisicing?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Consequatur quidem eius cum voluptatum quasi delectus assumenda culpa.',
  },
  {
    id: 3,
    question: 'Lorem ipsum dolor sit amet adipisicing?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Consequatur quidem eius cum voluptatum quasi delectus assumenda culpa.',
  },
  {
    id: 4,
    question: 'Lorem ipsum dolor sit amet adipisicing?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Consequatur quidem eius cum voluptatum quasi delectus assumenda culpa.',
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
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: 'auto',
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
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
  const [openId, setOpenId] = useState(1)
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
        <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Questions Fréquemment Posées
        </h2>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
          Vous avez des interrogations ? Nous avons rassemblé ici les réponses aux questions les plus courantes pour vous accompagner dans votre expérience.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left Column */}
        <div className="lg:col-span-4 lg:sticky lg:top-8">
          <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Encore des questions ?
          </h3>
          <p className="mt-4 text-gray-500 text-sm sm:text-base leading-relaxed">
            Vous n'avez pas trouvé la réponse que vous cherchiez ? Notre équipe est à votre
            disposition pour vous éclairer et vous accompagner dans votre projet.
          </p>
          <button className="mt-8 px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full sm:w-auto shadow-sm">
            Contactez notre support
          </button>
        </div>

        {/* Right Column - Accordion */}
        <div className="lg:col-span-8">
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
