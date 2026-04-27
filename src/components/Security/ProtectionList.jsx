import React from "react";
import { Shield, Bot, Clock, Lock } from "lucide-react";
import { Card } from "../../ui/Card";
import { Badge } from "../../ui/Badge";

const data = [
  {
    id: "1",
    name: "Brute Force Protection",
    icon: Shield,
    status: "Active",
  },
  {
    id: "2",
    name: "Bot Detection",
    icon: Bot,
    status: "Active",
  },
  {
    id: "3",
    name: "Rate Limiting",
    icon: Clock,
    status: "Active",
  },
  {
    id: "4",
    name: "Account Lock",
    icon: Lock,
    status: "Active",
  },
];

/**
 * UI component responsible for rendering the protection list section.
 */
export const ProtectionList = () => (
  <Card className="relative w-full overflow-hidden">
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900">Active Protections</h2>
    </div>
    <div className=" space-y-6 flex-1 ">
      {data.map((item) => (
        <div key={item.id} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <item.icon className="w-5 h-5 text-green-500" />
            <span className="text-gray-700 font-medium">{item.name}</span>
          </div>
          <Badge>{item.status}</Badge>
        </div>
      ))}
    </div>
    <div className="absolute -bottom-10 -right-27 p-2 opacity-5">
      <Shield size={220} />
    </div>
  </Card>
);
