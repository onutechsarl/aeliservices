import React from 'react';
import { motion } from 'framer-motion';
import { TestimonialCard } from '../ui/testimonialcard';


const testimonials = [
  [
    {
      name: 'Marie T.',
      role: 'Créatrice de mode éthique',
      avatar:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZ10hdlQsVFuUcCZxsf4Pq6iGxa4VAGdq2YQ&s',
      quote:
        'Avant AELI Services, mon travail manquait de visibilité. Cette plateforme a littéralement propulsé ma marque auprès d’un public que je n’aurais jamais pu atteindre seule. Un outil indispensable pour nous.',
    },
    {
      name: 'Sophie L.',
      role: 'Consultante en stratégie',
      avatar:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKiGXcI5XAawMYHEhQh1vBbWiNhjs7_08qpQ&s',
      quote:
        "La mise en relation avec d'autres entrepreneures via AELI Services est d'une simplicité déconcertante. C'est plus qu'une plateforme, c'est un véritable écosystème de soutien et de croissance.",
    },
    {
      name: "Abdoul P.",
      role: 'Artisan bijoutière',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
      quote:
        "AELI Services m'a aidé à professionnaliser mon image. Les clients me contactent désormais avec une confiance totale, car ils savent que je suis sur une plateforme sérieuse.",
    },
  ],
  [
    {
      name: 'Claire D.',
      role: 'Cliente fidèle',
      avatar:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw3gbHJ7nvUE5YRyg3tPEcaaKfHUSYG0H1AA&s',
      quote:
        'Je ne cherche plus mes prestataires ailleurs. AELI Services me permet de découvrir des talents incroyables dirigés par des femmes passionnées. Qualité et confiance garanties à chaque fois.',
    },
    {
      name: 'Jean S.',
      role: 'Co-fondateur Tech',
      avatar:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRC2r1eyzC8hxVSudTWCLltMLu9gYDUqIKWIA&s',
      quote:
        'AELI Services a comblé le fossé entre mon expertise technique et le grand public. En deux mois, ma base client a doublé grâce à la visibilité offerte par la plateforme.',
    },
    {
      name: 'Lucie B.',
      role: 'Décoratrice d’intérieur',
      avatar:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvEcb_cWAkTplyEewFjpqTrmTimGMzKz9oNQ&s',
      quote:
        'La plateforme est pensée pour mettre en valeur notre savoir-faire. Chaque détail de mon profil a été conçu pour convertir les visiteurs en clients réels.',
    },
  ],
  // Column 3
  [
    {
      name: 'Junior R.',
      role: 'Coach professionnelle',
      avatar:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCaHCZGw0dmTVDuVElhGk6sjuhrTiEyusg3Q&s',
      quote:
        'Le système de recommandation d\'AELI est incroyable. Mes prospects arrivent déjà qualifiés, ce qui me fait gagner un temps précieux.',
    },
    {
      name: 'Vanessa G.',
      role: 'Traiteur événementiel',
      avatar:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDGz9IaGH2gCJ4Xl5PeF7IG162SQVEmqjsgQ&s',
      quote:
        'Grâce à AELI Services, j’ai enfin pu présenter mes services de manière élégante et professionnelle. C\'est exactement ce qu\'il manquait à l\'entrepreneuriat féminin ici.',
    },
    {
      name: 'Franck K.',
      role: 'Client & Partenaire',
      avatar:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWqzHwKja1JO0OWW4_TZYoWjw7oCpx0zGhsA&s',
      quote:
        'Utiliser AELI Services, c\'est soutenir l\'économie locale. C\'est clair, moderne, et très efficace pour trouver des services de qualité.',
    },
  ],
];


export function TestimonialWall() {
  const flatTestimonials = testimonials.flat();
  const duplicatedTestimonials = [...flatTestimonials, ...flatTestimonials];

  return (
    <section className="py-24 relative overflow-hidden z-100">
      <div className="max-w-7xl mx-auto md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Ils font confiance à AELI Services
          </h2>
          <p className="text-gray-500 text-lg">
            Découvrez comment notre plateforme accompagne la réussite des entrepreneures et facilite des collaborations durables.
          </p>
        </div>
        <div className="flex md:hidden w-full overflow-hidden">
          <motion.div
            className="flex gap-4"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              duration: 40,
              ease: 'linear',
              repeat: Infinity,
            }}
          >
            {duplicatedTestimonials.map((testimonial, idx) => (
              <div key={idx} className="w-[85vw] flex-shrink-0 py-2">
                <TestimonialCard {...testimonial} />
              </div>
            ))}
          </motion.div>
        </div>
        <div
          className="hidden md:grid grid-cols-3 gap-5 items-start max-h-[700px] overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
          }}
        >
          {testimonials.map((column, colIdx) => (
            <div
              key={colIdx}
              className="flex flex-col gap-5"
              style={{
                marginTop:
                  colIdx === 1 ? '40px' : colIdx === 2 ? '20px' : '0px',
              }}
            >
              {column.map((testimonial, idx) => (
                <TestimonialCard key={idx} {...testimonial} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}