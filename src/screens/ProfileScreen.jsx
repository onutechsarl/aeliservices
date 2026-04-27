import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { useOutletContext } from 'react-router-dom';
import { ProfileSection } from '../components/profile/ProfileSection';
import { ProviderPanel } from '../components/profile/ProviderPanel';
import { Abonnement } from '../components/profile/Abonnement';
import { useGetProviderApplication } from '../hooks/useProvider';

/**
 * UI component responsible for rendering profile screen.
 */
export function ProfileScreen() {
  const [isRole, setIsRole] = useState();
  const { openManageDocuments } = useOutletContext();
  const { data: dataMyapply } = useGetProviderApplication();
  const application = dataMyapply?.data?.application;
  const isPendingApplication = application?.status === 'pending';
  return (
    <>
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start`}>
        <div className={`lg:col-span-7 xl:col-span-8 ${isRole === "provider" ? "lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-2" : ""}`}>
          <ProfileSection setIsRole={setIsRole} />
        </div>

        <div className="lg:col-span-5 xl:col-span-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-2 space-y-6">
          {(isRole === "provider" || isPendingApplication) &&
            <ProviderPanel onOpenManageDocuments={openManageDocuments} />
          }
          {!isPendingApplication &&
            <Abonnement isRole={isRole} />
          }
        </div>
      </div>
      <ToastContainer position="bottom-center" />
    </>
  )
}
