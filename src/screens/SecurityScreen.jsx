import React from "react";
import { ToastContainer } from "react-toastify";
import { Kpicount } from "../components/Security/KpiCount";
import { SecurPeriodeAnalytics } from "../components/Security/SecurPeriodeAnalytics";
import { RiskLevelDistribution } from "../components/Security/RiskLevelDistribution";
import { IpDetection } from "../components/Security/Ipdection";
import { BannedIPList } from "../components/Security/BannedIPList";
import { ProtectionList } from "../components/Security/ProtectionList";

/**
 * UI component responsible for rendering the security screen section.
 */
export function SecurityScreen() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <Kpicount />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px]">
            <SecurPeriodeAnalytics />
          </div>
          <div className="relative lg:col-span-1 h-[350px] p-2 overflow-hidden rounded-xl shadow-sm">
            <img
              src="./motifbg4.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-[4px] opacity-40"
            />
            <div className="relative z-10 h-full">
              <RiskLevelDistribution />
            </div>
          </div>
        </div>
        <IpDetection />
        <div className="flex flex-col md:flex-row gap-6">
          <BannedIPList />
          <ProtectionList />
        </div>
      </div>
      <ToastContainer position="bottom-center" />
    </div>
  );
}
