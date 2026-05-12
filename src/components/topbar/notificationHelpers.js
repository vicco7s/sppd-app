import { Bell, FileText, User, RefreshCw, CheckCircle, PlaneTakeoffIcon } from "lucide-react";

export function getNotificationIcon(type) {
  switch (type) {
    case "perjadin":
      return <FileText size={14} />;
    case "pegawai":
      return <User size={14} />;
    case "update":
      return <RefreshCw size={14} />;
    case "status":
      return <CheckCircle size={14} />;
    case "create":
      return <PlaneTakeoffIcon size={14} />;
    default:
      return <Bell size={14} />;
  }
}

export function getNotificationColor(type) {
  switch (type) {
    case "perjadin":
      return "bg-blue-100 text-blue-600";
    case "pegawai":
      return "bg-green-100 text-green-600";
    case "update":
      return "bg-amber-100 text-amber-600";
    case "status":
      return "bg-purple-100 text-purple-600";
    case "create":
      return "bg-indigo-100 text-indigo-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function formatNotificationDate(timestamp) {
  if (!timestamp?.toDate) return "Baru saja";
  const d = timestamp.toDate();
  const date = d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
  return `${date}, ${time}`;
}
