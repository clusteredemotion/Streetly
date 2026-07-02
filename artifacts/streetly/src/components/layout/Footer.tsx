import { Link } from "wouter";
import { MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background text-foreground py-12 border-t border-white/5">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-foreground hover:text-primary transition-colors">
              <MapPin className="h-6 w-6 text-primary" />
              <span>Streetly</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              The world's street-by-street business discovery platform. Find local gems anywhere, support your community.
            </p>
            <div className="flex gap-3">
              <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:-translate-y-0.5 transition-all duration-200"><Facebook className="h-4 w-4" /></a>
              <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:-translate-y-0.5 transition-all duration-200"><Twitter className="h-4 w-4" /></a>
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:-translate-y-0.5 transition-all duration-200"><Instagram className="h-4 w-4" /></a>
              <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:-translate-y-0.5 transition-all duration-200"><Linkedin className="h-4 w-4" /></a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-primary-foreground">Explore</h3>
            <ul className="space-y-2.5">
              <li><Link href="/businesses" className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline underline-offset-4">All Businesses</Link></li>
              <li><Link href="/explore" className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline underline-offset-4">Street Explorer</Link></li>
              <li><Link href="/categories" className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline underline-offset-4">Categories</Link></li>
              <li><Link href="/cities" className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline underline-offset-4">Cities</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-primary-foreground">For Partners</h3>
            <ul className="space-y-2.5">
              <li><Link href="/agents" className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline underline-offset-4">Become an Agent</Link></li>
              <li><Link href="/auth/register" className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline underline-offset-4">Add Your Business</Link></li>
              <li><Link href="/owner-dashboard" className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline underline-offset-4">Business Dashboard</Link></li>
              <li><Link href="/agent-dashboard" className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline underline-offset-4">Agent Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-primary-foreground">Legal</h3>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline underline-offset-4">About Us</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline underline-offset-4">Contact</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline underline-offset-4">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline underline-offset-4">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Streetly. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-muted-foreground text-sm flex items-center gap-1">
              Made with <span className="text-destructive">♥</span> for the world
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
