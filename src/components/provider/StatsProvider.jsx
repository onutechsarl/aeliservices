import React, { useMemo } from 'react';
import { MoreVertical, Mail, BarChart3, Users, AlertCircle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '../../ui/Button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Loading } from '../global/Loading';
import { NotFound } from '../global/Notfound';
import { useGetStatDaily, useGetReceivedContact } from '../../hooks/useContact';
import { useInfoUserConnected } from '../../hooks/useUser';

const data = [
  { name: '1-10', value: 65 },
  { name: '11-20', value: 45 },
  { name: '21-30', value: 55 },
  { name: '1-10', value: 55 },
  { name: '11-20', value: 55 },
]

/**
 * UI component responsible for rendering stats provider.
 */
export function StatsProvider({ showStats, setHideStats, setShowStats }) {
  const { openMessaging } = useOutletContext()
  const { data, refetch } = useInfoUserConnected();
  const provider = data?.data?.provider;

  const { data: statsResponse, isLoading, isError } = useGetStatDaily();
  const {
    data: receivedContactsResponse,
    isLoading: isLoadingReceivedContacts,
    isError: isErrorReceivedContacts,
  } = useGetReceivedContact();

  const dailyStats = statsResponse?.data?.dailyStats || [];
  const totalContacts = statsResponse?.data?.totalContacts || 0;

  const chartData = useMemo(() => {
    if (!dailyStats.length) return [];

    return [...dailyStats].reverse().map(item => ({

      name: new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),

      value: parseInt(item.count, 10)
    }));
  }, [dailyStats]);

  const latestContacts = useMemo(() => {
    const rawContacts = receivedContactsResponse?.data?.contacts || [];
    if (!rawContacts.length) return [];

    const sortedContacts = [...rawContacts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const uniqueBySender = new Map();

    sortedContacts.forEach((contact) => {
      const key = contact.senderEmail || contact.sender?.id || contact.id;

      if (!uniqueBySender.has(key)) {
        uniqueBySender.set(key, {
          id: key,
          name:
            `${contact.sender?.firstName || ''} ${contact.sender?.lastName || ''}`.trim() ||
            contact.senderName ||
            contact.senderEmail ||
            'Utilisateur',
          img: contact.sender?.profilePhoto || `./no-user.jpg`,
        });
      }
    });

    return Array.from(uniqueBySender.values()).slice(0, 5);
  }, [receivedContactsResponse]);

  return (
    <div className={`
      
      xl:static xl:w-[350px] xl:translate-x-0 xl:flex z-[100]
      
      fixed right-0 top-0 h-full w-[85%] sm:w-[400px]
      bg-white xl:bg-transparent transition-transform duration-300 ease-in-out 
      ${showStats ? 'translate-x-0' : 'translate-x-full'}
  `}>
      <div className="flex flex-col h-full w-full relative">
        <Button
          variant="tab"
          size="tab"
          onClick={() => (showStats ? setHideStats() : setShowStats(true))}
          className="xl:hidden fixed bottom-[40%] text-white h-[100px] -left-7 z-10 rounded-tr-none rounded-br-none "
        >
          {showStats ? <ChevronRight size={28} /> : <ChevronLeft size={28} />}
        </Button>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-18 md:pb-0 xl:py-0">
          <aside className="w-full xl:w-full bg-white p-6 flex flex-col gap-8 border-none md:border-2 md:border-gray-100 rounded-4xl xl:shadow-sm hover:shadow-xl transition-all duration-300 group md:mb-10">
            <div className="bg-pink-50/50 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <BarChart3 className="text-[#E8524D]" size={20} />
                  Mes stats
                </h3>
                <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-purple-600 shadow-sm">
                  {totalContacts} au total
                </span>
              </div>
              <div className="flex flex-col items-center mb-8">
                <div className="w-32 h-32 rounded-full border-4 border-pink-200 flex items-center justify-center relative mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden no-scrollbar">
                    <img
                      src={provider?.profilePhoto || `./defaultstructure.jpg`}
                      alt="Stats"
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>
                  <div className="absolute inset-0 border-t-4 border-purple-500 rounded-full rotate-45" />
                </div>
                <h4 className="font-bold text-gray-800"> {provider?.businessName || "Mon Entreprise"}</h4>
                <p className="text-xs text-gray-500 mt-1 ">
                  {provider?.description || "Mon Entreprise"}
                </p>
              </div>
              <div className="h-32 w-full">
                {isLoading ? (
                  <Loading className="h-full" size="small" title="Chargement des statistiques..." />
                ) : isError ? (
                  <NotFound
                    Icon={AlertCircle}
                    title="Erreur de chargement"
                    // message="Une erreur est survenue lors de la récupération des statistiques."
                    className="h-full py-4"
                  />
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === chartData.length - 1 ? '#C4B5FD' : '#FCE0D6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <NotFound
                    Icon={BarChart3}
                    title="Aucune donnée"
                    // message="Aucune statistique disponible pour le moment."
                    className="h-full py-4"
                  />
                )}
                {chartData.length > 0 && (
                  <div className="flex justify-between text-[10px] text-gray-400 mt-2 px-1">
                    <span>{chartData[0]?.name}</span>
                    <span>{chartData.length > 1 ? "Aujourd'hui" : ""}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <Users className="text-[#E8524D]" size={20} />
                Derniers contacts
              </h3>
              <div className="flex flex-col gap-4">
                {isLoadingReceivedContacts ? (
                  <Loading size="small" title="Chargement des contacts..." className="h-24" />
                ) : isErrorReceivedContacts ? (
                  <NotFound
                    Icon={AlertCircle}
                    title="Erreur de chargement"
                    // message="Impossible de récupérer les derniers contacts."
                    className="h-24 border-none py-2"
                  />
                ) : latestContacts.length === 0 ? (
                  <NotFound
                    Icon={Users}
                    title="Aucun contact"
                    // message="Vous n'avez encore reçu aucun contact."
                    className="h-24 border-none py-2"
                  />
                ) : (
                  latestContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={contact.img}
                          alt={contact.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="font-medium text-sm text-gray-700">
                          {contact.name}
                        </span>
                      </div>
                      <button
                        onClick={openMessaging}
                        className="px-3 py-1 rounded-full border border-purple-200 text-purple-600 text-xs font-medium hover:bg-purple-50 transition-colors">
                        Consulter
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="mt-auto">
              <Button
                variant="gradient"
                size="lg"
                className="w-full gap-2"
                onClick={openMessaging}
              >
                <Mail size={18} />
                Messagerie
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
