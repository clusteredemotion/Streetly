import { Link, useLocation } from "wouter";
import { Home, Building2, MapPinned, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavBadges } from "@/hooks/useNavBadges";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/businesses", label: "Directory", icon: Building2 },
  { href: "/properties", label: "Properties", icon: MapPinned },
  { href: "/account", label: "Account", icon: UserRound, badgeKey: "account" },
];

function BadgeDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white shadow-sm"
      aria-label={`${count} unread`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function BottomTabBar() {
  const [location] = useLocation();
  const { totalBadge } = useNavBadges();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[1100] bg-white/5 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/10 safe-bottom"
      aria-label="Primary"
    >
      <div className="grid grid-cols-4 max-w-md mx-auto">
        {tabs.map(({ href, label, icon: Icon, badgeKey }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          const badgeCount = badgeKey === "account" ? totalBadge : 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium leading-none transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span className="relative">
                <Icon className={cn("h-[18px] w-[18px]", active && "fill-primary/10")} strokeWidth={active ? 2.4 : 2} />
                <BadgeDot count={badgeCount} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
