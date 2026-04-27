import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import { ProviderListItem } from "../components/FeatureProvider/ProviderListItem";
import { ConfigurationPanel } from "../components/FeatureProvider/ConfigurationPanel";
import { FeaturedCard } from "../components/FeatureProvider/FeaturedCard";

/**
 * UI component responsible for rendering the feature provider screen section.
 */
export function FeatureProviderScreen() {
  const [selectedProvider, setSelectedProvider] = useState();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-4">
              <ProviderListItem setSelectedProvider={setSelectedProvider} />
            </div>
          </div>
          <aside className="lg:col-span-4">
            <div className="sticky top-10">
              <ConfigurationPanel selectedProvider={selectedProvider} />
            </div>
          </aside>
        </div>
        <hr className="border-slate-200" />
        <div className="space-y-6">
          <FeaturedCard />
        </div>
      </div>
      <ToastContainer position="bottom-center" />
    </div>
  );
}
