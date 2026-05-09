import React from "react";
import { Shield, AlertCircle, Users } from "lucide-react";
import { Table } from "../../ui/Table";
import { Card } from "../../ui/Card";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Loader } from "../global/Loader";
import { NotFound } from "../global/NotFound";

/**
 * Tableau de gestion des administrateurs.
 */
export const AdminTable = ({ admins, isLoading, isError, isDemoting, onDemote }) => {
  const headers = [
    "Administrateur",
    "Email",
    "Rôle",
    "Statut",
    "Dernière connexion",
    "Actions",
  ];

  if (isLoading) return <Loader variant="centered" message="Chargement des admins..." />;

  return (
    <Card>
      <div className="mb-3">
        <h1 className="text-xl text-gray-700 font-bold lg:pacifico-regular">Administrateurs</h1>
      </div>

      {isError ? (
        <NotFound
          Icon={AlertCircle}
          title="Erreur de chargement"
          message="Impossible de récupérer la liste des administrateurs."
        />
      ) : admins.length > 0 ? (
        <Table headers={headers}>
          {admins.map((admin) => (
            <tr key={admin.id} className="group hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      admin.profilePhoto ||
                      `https://ui-avatars.com/api/?name=${admin.firstName}+${admin.lastName}&background=random`
                    }
                    className="h-10 w-10 rounded-full object-cover border border-slate-200"
                    alt="avatar"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 leading-none truncate">
                      {admin.firstName} {admin.lastName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 italic">
                      ID: {(admin.id || "").slice(0, 8)}
                    </span>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4 text-xs text-slate-600">{admin.email}</td>

              <td className="px-6 py-4">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                  {admin.role || "admin"}
                </span>
              </td>

              <td className="px-6 py-4">
                <Badge
                  status={admin.isActive ? "Actif" : "Inactif"}
                  variant={admin.isActive ? "green" : "red"}
                />
              </td>

              <td className="px-6 py-4 text-[11px] text-slate-500">
                {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : "Jamais"}
              </td>

              <td className="px-6 py-4">
                <Button
                  variant="softRed"
                  onClick={() => onDemote(admin)}
                  disabled={isDemoting}
                  className="text-xs"
                >
                  <Shield size={14} />
                  {isDemoting ? "Traitement..." : "Rétrograder"}
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <NotFound
          Icon={Users}
          title="Aucun admin"
          message="Il n'y a aucun administrateur à afficher."
        />
      )}
    </Card>
  );
};

