"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { AppSetting } from "@/types";
import api from "@/lib/api";
import { Phone, Mail, Building2 } from "lucide-react";

// ── App settings form (SUPER_ADMIN only) ─────────────────────────────────────

type AppSettingsForm = { support_phone: string; support_email: string; company_name: string };

function AppSettingsCard() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<AppSettingsForm>({
    defaultValues: { support_phone: "", support_email: "", company_name: "" },
  });

  const { data: settings } = useQuery<AppSetting[]>({
    queryKey: ["app-settings"],
    queryFn: () => api.get("/settings").then(r => r.data),
  });

  useEffect(() => {
    if (!settings) return;
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
    reset({
      support_phone: map.support_phone || "",
      support_email: map.support_email || "",
      company_name: map.company_name || "",
    });
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: AppSettingsForm) =>
      api.put("/settings", [
        { key: "support_phone", value: data.support_phone },
        { key: "support_email", value: data.support_email },
        { key: "company_name",  value: data.company_name },
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("App settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-indigo-500" /> App Settings
        </CardTitle>
        <p className="text-sm text-gray-400">These settings appear on school order forms and notifications.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-gray-400" /> Support Phone Number
            </Label>
            <Input {...register("support_phone")} placeholder="+91-9876543210" />
            <p className="text-xs text-gray-400">Shown in the "Support" button on school order forms</p>
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gray-400" /> Support Email
            </Label>
            <Input {...register("support_email")} type="email" placeholder="support@yourcompany.com" />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-gray-400" /> Company / Brand Name
            </Label>
            <Input {...register("company_name")} placeholder="Uniform Manager" />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save App Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-2xl space-y-6">
        {/* App-level settings — super admin only */}
        {user?.role === "SUPER_ADMIN" && <AppSettingsCard />}

        <Card>
          <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={user?.name || ""} disabled />
            </div>
            <div className="space-y-1">
              <Label>Email Address</Label>
              <Input value={user?.email || ""} type="email" disabled />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Input value={user?.role?.replaceAll("_", " ") || ""} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Application Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">API Endpoint</span>
              <span className="font-mono text-xs">{process.env.NEXT_PUBLIC_API_URL}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
