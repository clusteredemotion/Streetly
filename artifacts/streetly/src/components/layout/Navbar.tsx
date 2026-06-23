import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = location === "/";

  const token = localStorage.getItem("streetly_token");
  const { data: user } = useGetMe({ query: { enabled: !!token } });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location]);

  const logout = () => {
    localStorage.removeItem("streetly_token");
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/businesses", label: "Directory" },
    { href: "/explore", label: "Street Explorer" },
    { href: "/agents", label: "Become an Agent" },
  ];

  const transparent = isHome && !scrolled && !isOpen;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300",
          transparent ? "glass-nav-transparent" : "glass-nav"
        )}
      >
        <div className="container mx-auto flex h-[58px] items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
              transparent ? "bg-white/15" : "bg-primary/10"
            )}>
              <MapPin className={cn("h-4 w-4", transparent ? "text-white" : "text-primary")} />
            </div>
            <span className={cn(
              "font-bold text-lg tracking-tight",
              transparent ? "text-white" : "text-foreground"
            )}>
              Streetly
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-1 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-150",
                  transparent
                    ? location === link.href
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                    : location === link.href
                      ? "bg-primary/8 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link href={
                  user.role === "field_agent" ? "/agent-dashboard"
                  : user.role === "business_owner" ? "/owner-dashboard"
                  : "/admin"
                }>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(transparent ? "text-white/80 hover:bg-white/10 hover:text-white" : "")}
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={logout}
                  className={cn(transparent ? "text-white/60 hover:bg-white/10 hover:text-white" : "")}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(transparent ? "text-white hover:bg-white/10" : "")}
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    size="sm"
                    className={cn(
                      "rounded-full px-5 font-semibold",
                      transparent
                        ? "bg-white text-primary hover:bg-white/90 shadow-lg"
                        : "shadow-sm"
                    )}
                  >
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className={cn(
              "md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors",
              transparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
            )}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden overflow-hidden glass-nav border-t border-white/10"
            >
              <nav className="container mx-auto px-4 py-4 flex flex-col gap-1 safe-bottom">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center justify-between text-sm font-medium p-3 rounded-xl transition-colors",
                        location === link.href
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {link.label}
                      <ChevronRight className="h-4 w-4 opacity-40" />
                    </Link>
                  </motion.div>
                ))}

                <div className="h-px bg-border my-2" />

                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link href={user.role === "field_agent" ? "/agent-dashboard" : user.role === "business_owner" ? "/owner-dashboard" : "/admin"}>
                      <Button variant="outline" className="w-full rounded-xl" onClick={() => setIsOpen(false)}>
                        Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full rounded-xl" onClick={() => { logout(); setIsOpen(false); }}>
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pt-1">
                    <Link href="/auth/login">
                      <Button variant="outline" className="w-full rounded-xl" onClick={() => setIsOpen(false)}>
                        Log in
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button className="w-full rounded-xl font-semibold" onClick={() => setIsOpen(false)}>
                        Sign up — it's free
                      </Button>
                    </Link>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for non-home pages */}
      {!isHome && <div className="h-[58px]" />}
    </>
  );
}
