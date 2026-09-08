"use client";

import { getNotificationIcon, getNotificationColor, formatNotificationDate } from "./notificationHelpers";

export default function NotificationItem({ notification }) {
  return (
    <div className="notification-item rounded-[20px] border border-slate-200/70 bg-white/70 p-4 transition duration-200 hover:bg-white/80 hover:shadow-[0_12px_40px_rgba(15,23,42,0.1)] backdrop-blur-[6px]">
      <div className="flex gap-3">
        <div className={`flex h-10 w-10 items-center justify-center shrink-0 rounded-full ${getNotificationColor(notification.type)} relative`}>
          {getNotificationIcon(notification.type)}
          {!notification.isRead && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 animate-pulse" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm leading-tight ${!notification.isRead ? "font-bold text-slate-950" : "font-medium text-slate-900"}`}>
            {notification.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 line-clamp-2">{notification.message}</p>
          <div className="mt-3 flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-500">
              Oleh: {notification.userName || notification.userEmail || "Sistem"}
            </span>
            <span className="text-[10px] text-slate-400">{formatNotificationDate(notification.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
