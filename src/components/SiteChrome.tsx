import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useScroll } from "motion/react";
import { Instagram, Linkedin, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ScrollProgress } from "@/components/motion-kit";

function AdminLink({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return (
    <Link
      to="/admin"
      onClick={onNavigate}
      className={
        mobile
          ? "rounded-xl px-4 py-3 text-left hover:bg-black/[0.04] w-full block"
          : "transition-colors hover:text-foreground"
      }
    >
      Admin
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    void import("@/integrations/supabase/client")
      .then(async ({ supabase }) => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;

        setSignedIn(Boolean(data.session));
        const { data: authState } = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted) setSignedIn(Boolean(session));
        });
        unsubscribe = () => authState.subscription.unsubscribe();
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setSignedIn(false);
        console.error("Could not check the Supabase session", error);
      });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);
  useEffect(() => scrollY.on("change", (value) => setScrolled(value > 18)), [scrollY]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const nav = [
    { label: "Members", to: "/members" as const },
    { label: "Events", to: "/events" as const },
    { label: "Projects", to: "/projects" as const },
    { label: "Feed", to: "/announcements" as const },
  ];

  const handleSignOut = async () => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Could not sign out of Supabase", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <ScrollProgress />
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 sm:px-5 ${scrolled ? "glass-strong shadow-[var(--shadow-glow)]" : "border border-transparent"}`}
      >
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <img
            src="/vertex-logo-transparent.png"
            alt="Vertex"
            className="h-8 w-auto"
            width={80}
            height={32}
            decoding="async"
          />
        </Link>
        <nav className="hidden items-center gap-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground lg:flex">
          {nav.map((item) => (
            <Link key={item.label} to={item.to} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
          <AdminLink />
          <Link to="/join" className="hover:text-foreground">
            Join
          </Link>
          {signedIn ? (
            <button
              onClick={handleSignOut}
              className="btn-ghost rounded-lg px-3 py-1.5 hover:text-foreground"
            >
              Sign out
            </button>
          ) : (
            <Link to="/auth" className="btn-ghost rounded-lg px-3 py-1.5 hover:text-foreground">
              Sign in
            </Link>
          )}
        </nav>
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
          className="glass-panel rounded-lg p-2 lg:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass-strong absolute inset-x-3 top-[4.8rem] rounded-2xl p-4 sm:inset-x-5 lg:hidden"
          >
            <nav className="grid gap-1 font-display text-2xl">
              {nav.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 hover:bg-black/[0.04]"
                >
                  {item.label}
                </Link>
              ))}
              <div
                className="rounded-xl px-4 py-3 hover:bg-black/[0.04]"
                onClick={() => setOpen(false)}
              >
                <AdminLink mobile onNavigate={() => setOpen(false)} />
              </div>
              <Link
                to="/join"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-xl bg-foreground px-4 py-3 text-background"
              >
                Join Vertex →
              </Link>
              {signedIn && (
                <button
                  onClick={handleSignOut}
                  className="mt-2 rounded-xl border border-hairline px-4 py-3 text-left"
                >
                  Sign out
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

const socials = [
  { label: "Instagram", href: "https://www.instagram.com/vertex.reva/", Icon: Instagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/vertexclub", Icon: Linkedin },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/vertex-logo-transparent.png"
            alt="Vertex"
            className="h-10 w-auto"
            width={120}
            height={40}
            decoding="async"
          />
          <div>
            <div className="font-display text-xl font-semibold">Vertex</div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              The Tech Club · Est. 2026
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          {socials.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="text-muted-foreground transition-colors hover:text-silver"
            >
              <Icon size={18} />
            </a>
          ))}
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          © {new Date().getFullYear()} Vertex
        </div>
      </div>
    </footer>
  );
}
