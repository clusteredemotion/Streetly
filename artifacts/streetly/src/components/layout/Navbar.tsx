import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin, ChevronRight, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = location === "/";

  const token = localStorage.getItem("streetly_token");
  const { data: user } = useGetMe({ query: { enabled: !!token, queryKey: ["getMe", !!token] } });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    return "Good evening";
  })();
  const firstName = user?.name?.split(" ")[0] ?? "";

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

  const isAgent = user?.role === "field_agent";
  const isRider = user?.role === "delivery_rider";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/properties", label: "Properties" },
    { href: "/businesses", label: "Directory" },
    { href: "/explore", label: "Street Explorer" },
    ...(!isAgent ? [{ href: "/agents", label: "Become an Agent" }] : []),
    ...(!isRider ? [{ href: "/riders/apply", label: "Become a Rider" }] : []),
    ...(!user ? [{ href: "/auth/register?role=business_owner", label: "List Your Business" }] : []),
    ...(user ? [{ href: "/account", label: "My Account" }] : []),
    ...(user ? [{ href: "/messages", label: "Messages" }] : []),
    ...(user ? [{ href: "/support", label: "Support Tickets" }] : []),
  ];

  const dashboardHref = (role: string | undefined) =>
    role === "field_agent" ? "/agent-dashboard"
    : role === "delivery_rider" ? "/rider-dashboard"
    : role === "business_owner" ? "/owner-dashboard"
    : role === "admin" ? "/admin"
    : role === "moderator" ? "/moderator"
    : role === "scout_manager" ? "/scout-manager"
    : role === "regional_manager" ? "/regional-manager"
    : "/account";

  /* onMap = sitting at the top of the home page (map is fully visible behind us)
     → needs a light frosted glass bar with dark-blue text so it reads on light map tiles.
     scrolledHome = user has scrolled past the map into the dark content sections
     → needs white text on the dark glass bar.
     otherPage = any non-home route → same dark glass + white text. */
  const onMap = isHome && !scrolled && !isOpen;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-[1100] w-full transition-all duration-300",
          onMap ? "glass-nav-transparent" : "glass-nav"
        )}
      >
        <div className="container mx-auto flex h-[58px] items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
              onMap ? "bg-blue-700/10" : "bg-white/10"
            )}>
              <MapPin className={cn("h-4 w-4", onMap ? "text-[#0547B6]" : "text-white")} />
            </div>
            <span className={cn(
              "font-bold text-lg tracking-tight transition-colors",
              onMap ? "text-[#0547B6]" : "text-white"
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
                  onMap
                    ? location === link.href
                      ? "bg-blue-700/10 text-[#0547B6]"
                      : "text-[#0547B6]/75 hover:bg-blue-700/8 hover:text-[#0547B6]"
                    : location === link.href
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
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
                <span className={cn(
                  "text-sm font-medium hidden lg:block",
                  onMap ? "text-[#0547B6]/80" : "text-white/70"
                )}>
                  {greeting}, <span className="font-semibold">{firstName}</span> 👋
                </span>
                <Link href="/account">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(onMap
                      ? "text-[#0547B6]/80 hover:bg-blue-700/8 hover:text-[#0547B6]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Account
                  </Button>
                </Link>
                <Link href={dashboardHref(user.role)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(onMap
                      ? "text-[#0547B6]/80 hover:bg-blue-700/8 hover:text-[#0547B6]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={logout}
                  className={cn(onMap
                    ? "text-[#0547B6]/60 hover:bg-blue-700/8 hover:text-[#0547B6]"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                  )}
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
                    className={cn(onMap
                      ? "text-[#0547B6] hover:bg-blue-700/8"
                      : "text-white hover:bg-white/10"
                    )}
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    size="sm"
                    className={cn(
                      "rounded-full px-5 font-semibold",
                      onMap
                        ? "bg-[#0547B6] text-white hover:bg-[#0437a0] shadow-lg"
                        : "bg-white text-[#0547B6] hover:bg-white/90 shadow-lg"
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
              onMap
                ? "text-[#0547B6] hover:bg-blue-700/8"
                : "text-white hover:bg-white/10"
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
                          ? "bg-white/15 text-white"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {link.label}
                      <ChevronRight className="h-4 w-4 opacity-40" />
                    </Link>
                  </motion.div>
                ))}

                <div className="h-px bg-white/10 my-2" />

                {user ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-white/60 px-1 font-medium">
                      {greeting}, <span className="text-white font-semibold">{firstName}</span> 👋
                    </p>
                    <Link href={dashboardHref(user.role)}>
                      <Button variant="outline" className="w-full rounded-xl text-white border-white/20 hover:bg-white/10" onClick={() => setIsOpen(false)}>
                        Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full rounded-xl text-white/70 hover:bg-white/10" onClick={() => { logout(); setIsOpen(false); }}>
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pt-1">
                    <Link href="/auth/login">
                      <Button variant="outline" className="w-full rounded-xl text-white border-white/20 hover:bg-white/10" onClick={() => setIsOpen(false)}>
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
