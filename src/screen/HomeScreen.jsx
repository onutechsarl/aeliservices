

import React from 'react';
import { SocialSidebar } from '../components/SocialSidebar';
import { HeroSection } from '../components/Hero';
import { FeatureCards } from '../components/FeatureCards';
import { Pricing } from "../components/Pricing";
import { MoreThanLogin } from '../components/AppPresentation';
import { TestimonialWall } from '../components/TestimonialWall';
import { Banner } from '../components/Banner';
import { Footer } from '../components/Footer';


export function HomeScreen() {
    return (
        <div className="w-full min-h-screen bg-white font-poppins relative">
            <main>
                <HeroSection />
                <Pricing />
                <MoreThanLogin />
                <SocialSidebar />
                <div className="relative z-10">
                    <TestimonialWall />
                    <Banner />
                    <Footer />
                </div>
            </main>
        </div>
    )
}
