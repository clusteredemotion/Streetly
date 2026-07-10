import { Link, useLocation } from "wouter";
import { Home, Building2, MapPinned, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/businesses", label: "Directory", icon: Building2 },
  { href: "/properties", label: "Properties", icon: MapPinned },
  { href: "/account", label: "Account", icon: UserRound },
];

export function BottomTabBar() {
  const [location] = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[1100] bg-background/95 backdrop-blur-lg border-t border-white/10 safe-bottom"
      aria-label="Primary"
    >
      <div className="grid grid-cols-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "fill-primary/10")} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
