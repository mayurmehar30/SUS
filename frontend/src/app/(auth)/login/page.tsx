"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ShirtIcon, GraduationCap, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

const features = [
  { icon: GraduationCap, label: "School Management",  desc: "Manage multiple schools from one dashboard" },
  { icon: Package,        label: "Order Tracking",     desc: "Track every order from cut to delivery"     },
  { icon: TrendingUp,     label: "Production Reports", desc: "Real-time production and payment insights"  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", data);
      const { token, name, email, role } = res.data;
      login(token, { id: 0, name, email, role });
      if (typeof window !== "undefined") {
        localStorage.setItem("sus_token", token);
        document.cookie = `sus_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      }
      toast.success("Welcome back, " + name);
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel (branding) ── */}
      <div className="relative hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 flex-col items-center justify-center p-12 overflow-hidden">

        {/* decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-sm text-white">
          {/* logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur rounded-2xl ring-1 ring-white/30">
              <ShirtIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">SUS</p>
              <p className="text-indigo-200 text-xs">School Uniform System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Uniforms managed,<br />orders delivered.
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed mb-10">
            End-to-end platform for school uniform procurement, production tracking, and order fulfilment.
          </p>

          <div className="space-y-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-white/15 rounded-lg mt-0.5">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-indigo-200 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center min-h-screen lg:min-h-0 bg-slate-50 px-6 py-12">

        {/* mobile logo */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-3 shadow-lg shadow-indigo-200">
            <ShirtIcon className="h-7 w-7 text-white" />
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sus.com"
                autoComplete="email"
                className="h-11 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">{errors.email.message}</p>
              )}
            </div>

            {/* password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="h-11 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl pr-11"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all duration-150 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>

          </form>

        </div>
      </div>
    </div>
  );
}
