import React, { useState } from "react";
import { UserPlus, ArrowUpCircle } from "lucide-react";
import { Card } from "../../ui/Card";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";

/**
 * Formulaire de création / promotion d'admin.
 */
export const AdminCreateForm = ({
  onCreateAdmin,
  onPromoteAdmin,
  isCreating,
  isPromoting,
}) => {
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [promoteUserId, setPromoteUserId] = useState("");

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onCreateAdmin(createForm, () => {
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
      });
    });
  };

  const handlePromoteSubmit = (e) => {
    e.preventDefault();
    onPromoteAdmin(promoteUserId, () => setPromoteUserId(""));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
      <Card>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Créer un admin</h2>
        <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Prénom"
            name="firstName"
            value={createForm.firstName}
            onChange={handleCreateChange}
            placeholder="Ex: Jean"
            required
          />
          <Input
            label="Nom"
            name="lastName"
            value={createForm.lastName}
            onChange={handleCreateChange}
            placeholder="Ex: Dupont"
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={createForm.email}
            onChange={handleCreateChange}
            placeholder="admin@aeli.com"
            required
          />
          <Input
            label="Téléphone"
            name="phone"
            value={createForm.phone}
            onChange={handleCreateChange}
            placeholder="Optionnel"
          />
          <div className="md:col-span-2">
            <Input
              label="Mot de passe"
              name="password"
              type="password"
              value={createForm.password}
              onChange={handleCreateChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" variant="primary" disabled={isCreating}>
              <UserPlus size={16} />
              {isCreating ? "Création..." : "Créer l'admin"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="h-fit">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Promouvoir un utilisateur</h2>
        <form onSubmit={handlePromoteSubmit} className="space-y-3">
          <Input
            label="ID utilisateur"
            name="promoteUserId"
            value={promoteUserId}
            onChange={(e) => setPromoteUserId(e.target.value)}
            placeholder="UUID de l'utilisateur à promouvoir"
            required
          />

          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={isPromoting || !promoteUserId}>
              <ArrowUpCircle size={16} />
              {isPromoting ? "Promotion..." : "Promouvoir"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

