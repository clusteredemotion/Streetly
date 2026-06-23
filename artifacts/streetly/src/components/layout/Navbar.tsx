import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const token = localStorage.getItem("streetly_token");
  const { data: user } = useGetMe({ query: { enabled: !!token } });

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <MapPin className="h-6 w-6" />
          <span>Streetly</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location === link.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="flex items-center gap-4 ml-4">
            {user ? (
              <>
                <Link href={user.role === 'field_agent' ? '/agent-dashboard' : user.role === 'business_owner' ? '/owner-dashboard' : '/'}>
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Nav Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="md:hidden border-t p-4 bg-background">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-sm font-medium p-2 rounded-md transition-colors hover:bg-muted",
                  location === link.href ? "text-primary bg-muted/50" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="h-px bg-border my-2" />
            
            {user ? (
              <div className="flex flex-col gap-2">
                <Link href={user.role === 'field_agent' ? '/agent-dashboard' : user.role === 'business_owner' ? '/owner-dashboard' : '/'}>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setIsOpen(false)}>Dashboard</Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { logout(); setIsOpen(false); }}>Logout</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOpen(false)}>Log in</Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="w-full justify-start" onClick={() => setIsOpen(false)}>Sign up</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
