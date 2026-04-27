import React from "react";
import { ToastContainer } from "react-toastify";
import { KpiCount } from "../components/dashboard/KpiCount";
import { PaymentSummary } from "../components/dashboard/PaymentSummary";
import { ContactAnalytics } from "../components/dashboard/ContactAnalytics";
import { ProviderStatusList } from "../components/dashboard/ProviderStatusList";
import { UsersAnalytics } from "../components/dashboard/UsersAnalytics";
import { UserComposition } from "../components/dashboard/UserComposition";
import { LastusersRegister } from "../components/dashboard/LastusersRegister";

/**
 * UI component responsible for rendering the dashboard section.
 */
export function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <KpiCount />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 xl:col-span-4">
            <PaymentSummary />
          </div>
          <div className="lg:col-span-4 xl:col-span-4">
            <ContactAnalytics />
          </div>
          <div className="lg:col-span-3 xl:col-span-4">
            <ProviderStatusList />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px]">
            <UsersAnalytics />
          </div>
          <div className="relative lg:col-span-1 h-[350px] p-2 overflow-hidden rounded-xl shadow-sm">
            <img
              src="./motifbg4.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-[4px] opacity-40"
            />
            <div className="relative z-10 h-full">
              <UserComposition />
            </div>
          </div>
        </div>
        <LastusersRegister />
      </div>
      <ToastContainer position="bottom-center" />
    </div>
  );
}
