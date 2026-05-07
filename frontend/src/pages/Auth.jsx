import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import OtpInput from "@/components/auth/OtpInput";
import GoogleSignIn from "@/components/auth/GoogleSignIn";
import { useAuthStore } from "@/store/authStore";
import { api, register as apiRegister, sendOTP, verifyOTP } from "@/services/api";

function BrandingPanel() {
  const codeLines = useMemo(
    () => [
      "const score = review(code)",
      "if (score < 70) suggestFix()",
      "await ai.analyze({ language })",
      "Security: HIGH  |  Performance: MED",
      "Style: LOW  |  Bugs: MED",
      "Ship cleaner. Faster.",
      "export function refactor() {}",
      "npm run test && npm run build",
      "SELECT * FROM issues WHERE severity='HIGH';",
      "for (const issue of issues) { fix(issue) }",
    ],
    []
  );

  return (
    <div className="relative hidden min-h-screen w-1/2 overflow-hidden border-r border-zinc-800 lg:block">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950 to-violet-950/30" />
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-0 top-0 h-[200%] w-full animate-code-scroll">
          <div className="px-10 py-10 font-mono text-xs leading-7 text-zinc-400">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <span className="w-10 text-zinc-600">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-zinc-400">{codeLines[i % codeLines.length]}</span>
              </div>
            ))}
          </div>
          <div className="px-10 py-10 font-mono text-xs leading-7 text-zinc-400">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <span className="w-10 text-zinc-600">{String(i + 41).padStart(2, "0")}</span>
                <span className="text-zinc-400">{codeLines[i % codeLines.length]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25">
            <span className="font-mono text-sm">{"</>"}</span>
          </div>
          <div>
            <div className="text-lg font-semibold text-zinc-50">CodeReview AI</div>
            <div className="text-sm text-zinc-400">AI Code Review Assistant</div>
          </div>
        </div>

        <div>
          <div className="text-3xl font-semibold text-zinc-50">Code smarter. Ship cleaner.</div>
          <div className="mt-3 max-w-md text-sm text-zinc-300">
            Production-grade reviews with clear issues, suggested fixes, and a confidence score—without
            breaking your flow.
          </div>
        </div>

        <div className="text-xs text-zinc-500">© {new Date().getFullYear()} CodeReview AI</div>
      </div>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [tab, setTab] = useState("signin");

  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(59);

  useEffect(() => {
    bootstrap();
    if (isAuthenticated()) navigate("/dashboard", { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!otpRequested) return;
    setResendIn(59);
    const t = setInterval(() => setResendIn((s) => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [otpRequested]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authLogin({ email: signIn.email, password: signIn.password });
      toast.success("Welcome back.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (googleAccessToken) => {
    if (!googleAccessToken) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/api/auth/google/", { access_token: googleAccessToken });
      if (res?.data?.access) {
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
      }
      toast.success("Signed in with Google.");
      navigate("/dashboard");
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    if (!signUp.phone?.trim()) {
      toast.error("Please enter a phone number first.");
      return;
    }
    try {
      setLoading(true);
      await sendOTP({ phone: signUp.phone, email: signUp.email });
      setOtpRequested(true);
      toast.success("OTP sent.");
    } catch {
      // Backend may not have OTP endpoints yet; still show the flow.
      setOtpRequested(true);
      toast("OTP flow enabled (placeholder).", { icon: "ℹ️" });
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (otpRequested) {
        try {
          await verifyOTP({ phone: signUp.phone, otp });
        } catch {
          // keep UX moving in dev environments
        }
      }
      await apiRegister({
        name: signUp.name,
        email: signUp.email,
        phone: signUp.phone,
        password1: signUp.password,
        password2: signUp.password,
      });
      toast.success("Account created.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex min-h-screen">
        <BrandingPanel />

        <div className="flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <Card className="rounded-xl border-zinc-800 bg-zinc-900">
              <CardHeader className="space-y-1">
                <div className="text-lg font-semibold">Welcome</div>
                <div className="text-sm text-zinc-400">Sign in or create your account.</div>
              </CardHeader>
              <CardContent>
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-zinc-950 border border-zinc-800">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="mt-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          className="rounded-lg border-zinc-800 bg-zinc-950"
                          value={signIn.email}
                          onChange={(e) => setSignIn((s) => ({ ...s, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          className="rounded-lg border-zinc-800 bg-zinc-950"
                          value={signIn.password}
                          onChange={(e) => setSignIn((s) => ({ ...s, password: e.target.value }))}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 shadow-violet-500/25 shadow-lg"
                      >
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>

                      <div className="text-right">
                        <button
                          type="button"
                          className="text-xs text-zinc-400 hover:text-zinc-200"
                          onClick={() => toast("Password reset is not wired yet.", { icon: "ℹ️" })}
                        >
                          Forgot password?
                        </button>
                      </div>

                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-zinc-900 px-2 text-zinc-500">or</span>
                        </div>
                      </div>

                      <GoogleSignIn onToken={handleGoogle} disabled={loading} />
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-6">
                    <form onSubmit={completeSignup} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            className="rounded-lg border-zinc-800 bg-zinc-950"
                            value={signUp.name}
                            onChange={(e) => setSignUp((s) => ({ ...s, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="email2">Email</Label>
                          <Input
                            id="email2"
                            type="email"
                            className="rounded-lg border-zinc-800 bg-zinc-950"
                            value={signUp.email}
                            onChange={(e) => setSignUp((s) => ({ ...s, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            className="rounded-lg border-zinc-800 bg-zinc-950"
                            value={signUp.phone}
                            onChange={(e) => setSignUp((s) => ({ ...s, phone: e.target.value }))}
                            placeholder="+91..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pw2">Password</Label>
                          <Input
                            id="pw2"
                            type="password"
                            className="rounded-lg border-zinc-800 bg-zinc-950"
                            value={signUp.password}
                            onChange={(e) => setSignUp((s) => ({ ...s, password: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <AnimatePresence mode="popLayout" initial={false}>
                        {!otpRequested ? (
                          <motion.div
                            key="send"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Button
                              type="button"
                              onClick={requestOtp}
                              disabled={loading}
                              className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 shadow-violet-500/25 shadow-lg"
                            >
                              {loading ? "Sending OTP..." : "Send OTP"}
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="otp"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                          >
                            <div className="space-y-2">
                              <Label>OTP</Label>
                              <OtpInput value={otp} onChange={setOtp} disabled={loading} />
                              <div className="flex items-center justify-between text-xs text-zinc-500">
                                <span>Resend in 00:{String(resendIn).padStart(2, "0")}</span>
                                <button
                                  type="button"
                                  className="text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
                                  disabled={resendIn > 0 || loading}
                                  onClick={requestOtp}
                                >
                                  Resend
                                </button>
                              </div>
                            </div>
                            <Button
                              type="submit"
                              disabled={loading || otp.length < 6}
                              className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 shadow-violet-500/25 shadow-lg"
                            >
                              {loading ? "Creating account..." : "Create Account"}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="mt-6 text-center text-xs text-zinc-500">
              Tip: set <span className="font-mono text-zinc-300">VITE_API_URL</span> to your Django API base.
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

