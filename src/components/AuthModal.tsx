"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import LoginForm from "./auth/LoginForm";
import RegisterForm from "./auth/RegisterForm";

export type AuthMode = "login" | "register";

const AuthModalContext = createContext<{
  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;
} | null>(null);

/** Open the animated login/register popup from anywhere. */
export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}

const spring = { type: "spring", damping: 30, stiffness: 340 } as const;

/** Provides the auth modal state and renders the animated popup. */
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [registeredName, setRegisteredName] = useState<string | null>(null);
  const router = useRouter();

  const openAuthModal = useCallback((m: AuthMode = "login") => {
    setRegisteredName(null);
    setMode(m);
    setOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setOpen(false), []);

  const switchMode = useCallback((m: AuthMode) => {
    setRegisteredName(null);
    setMode(m);
  }, []);

  /* Escape to close + lock body scroll while open. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open ]);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeAuthModal}
              className="absolute inset-0 bg-ink/80 backdrop-blur-md"
            />
            {/* Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={mode === "login" ? "Log in" : "Register"}
              initial={{ opacity: 0, y: 56, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 36, scale: 0.96 }}
              transition={spring}
              className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-gold/25 bg-gradient-to-b from-ink-2 to-ink shadow-[0_0_80px_rgba(212,169,78,0.18),0_32px_80px_rgba(0,0,0,0.6)]"
            >
              {/* gold top edge */}
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />

              <button
                onClick={closeAuthModal}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-ivory/10 bg-ink/60 text-lg text-muted transition-colors hover:border-gold/40 hover:text-gold-2"
              >
                ✕
              </button>

              <div className="px-6 py-8 sm:px-10 sm:py-10">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.4 }}
                  className="flex flex-col items-center text-center"
                >
                  <span className="seal-ring relative block h-16 w-16 overflow-hidden rounded-full">
                    <Image src="/images/logo.jpg" alt="BCBHS Alumni" fill className="object-cover" />
                  </span>
                  <h2 className="font-display mt-4 text-2xl font-bold text-ivory sm:text-3xl">
                    {registeredName ? (
                      <>Welcome aboard, <span className="text-gold-gradient">{registeredName}</span>!</>
                    ) : mode === "login" ? (
                      <>Welcome <span className="text-gold-gradient">back</span></>
                    ) : (
                      <>Join the <span className="text-gold-gradient">brotherhood</span></>
                    )}
                  </h2>
                  <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted">
                    {registeredName
                      ? "Your registration is in — an admin will verify it shortly."
                      : mode === "login"
                        ? "Log in to your alumni home, ID card and member tools."
                        : "Every registration is verified by an admin — no fake members, ever."}
                  </p>
                </motion.div>

                {registeredName ? (
                  /* ---- success state ---- */
                  <motion.div
                    key="auth-success"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={spring}
                    className="mx-auto mt-8 max-w-md text-center"
                  >
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...spring, delay: 0.1 }}
                      className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-4xl text-gold-2 ring-2 ring-gold/50"
                    >
                      ✓
                    </motion.p>
                    <p className="mt-5 text-sm leading-relaxed text-muted">
                      Your profile was submitted as <span className="font-semibold text-gold-2">pending</span>.
                      Once approved, your official digital ID card with QR verification is generated automatically.
                    </p>
                    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                      <button
                        onClick={() => {
                          closeAuthModal();
                          router.push("/directory");
                        }}
                        className="rounded-full border border-gold/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold-2 transition-colors hover:bg-gold/10"
                      >
                        Browse Directory
                      </button>
                      <button
                        onClick={closeAuthModal}
                        className="rounded-full px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-ivory"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* ---- tabs ---- */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.14, duration: 0.4 }}
                      className="relative mx-auto mt-7 grid max-w-md grid-cols-2 rounded-full border border-ivory/10 bg-ink p-1"
                    >
                      {(["login", "register"] as AuthMode[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => switchMode(m)}
                          className={`relative rounded-full py-2.5 text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${
                            mode === m ? "text-ink" : "text-muted hover:text-ivory"
                          }`}
                        >
                          {mode === m && (
                            <motion.span
                              layoutId="auth-tab-pill"
                              transition={spring}
                              className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep shadow-[0_0_20px_rgba(212,169,78,0.5)]"
                            />
                          )}
                          <span className="relative z-10">{m === "login" ? "Login" : "Register"}</span>
                        </button>
                      ))}
                    </motion.div>

                    {/* ---- forms ---- */}
                    <div className="mx-auto mt-7 max-w-md">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={mode}
                          initial={{ opacity: 0, x: mode === "register" ? 48 : -48 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: mode === "register" ? -48 : 48 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {mode === "login" ? (
                            <LoginForm
                              onSuccess={closeAuthModal}
                              onSwitchToRegister={() => switchMode("register")}
                            />
                          ) : (
                            <RegisterForm
                              onSuccess={(first) => setRegisteredName(first)}
                              onSwitchToLogin={() => switchMode("login")}
                            />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthModalContext.Provider>
  );
}
