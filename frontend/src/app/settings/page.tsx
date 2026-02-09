"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Settings, User, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const { user, checking } = useRequireAuth();
  const [email, setEmail] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile Section */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <p className="text-sm text-gray-900">{email}</p>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Account ID
              </label>
              <p className="text-sm text-gray-500 font-mono text-[13px]">{user?.id?.slice(0, 8)}...</p>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="p-5 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm text-gray-900">Campaign approvals</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Get notified when campaigns need approval</p>
              </div>
              <div className="relative">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-indigo-600 rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm text-gray-900">Creator responses</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Get notified when creators respond to outreach</p>
              </div>
              <div className="relative">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-indigo-600 rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm text-gray-900">Campaign completion</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Get notified when campaigns finish running</p>
              </div>
              <div className="relative">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-indigo-600 rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
              </div>
            </label>
          </div>
        </div>

        {/* Security Section */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Security</h2>
          </div>
          <div className="p-5">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              Sign out of all devices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
