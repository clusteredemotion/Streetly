import { Link } from "wouter";
import { MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background text-foreground py-12">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-foreground">
              <MapPin className="h-6 w-6" />
              <span>Streetly</span>
            </Link>
            <p className="text-muted text-sm max-w-xs">
              The world's street-by-street business discovery platform. Find local gems anywhere, support your community.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted hover:text-primary-foreground transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-muted hover:text-primary-foreground transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-muted hover:text-primary-foreground transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-muted hover:text-primary-foreground transition-colors"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4 text-primary-foreground">Explore</h3>
            <ul className="space-y-2">
              <li><Link href="/businesses" className="text-muted hover:text-primary-foreground text-sm">All Businesses</Link></li>
              <li><Link href="/explore" className="text-muted hover:text-primary-foreground text-sm">Street Explorer</Link></li>
              <li><Link href="/categories" className="text-muted hover:text-primary-foreground text-sm">Categories</Link></li>
              <li><Link href="/cities" className="text-muted hover:text-primary-foreground text-sm">Cities</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4 text-primary-foreground">For Partners</h3>
            <ul className="space-y-2">
              <li><Link href="/agents" className="text-muted hover:text-primary-foreground text-sm">Become an Agent</Link></li>
              <li><Link href="/auth/register" className="text-muted hover:text-primary-foreground text-sm">Add Your Business</Link></li>
              <li><Link href="/owner-dashboard" className="text-muted hover:text-primary-foreground text-sm">Business Dashboard</Link></li>
              <li><Link href="/agent-dashboard" className="text-muted hover:text-primary-foreground text-sm">Agent Dashboard</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4 text-primary-foreground">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-muted hover:text-primary-foreground text-sm">About Us</Link></li>
              <li><Link href="/contact" className="text-muted hover:text-primary-foreground text-sm">Contact</Link></li>
              <li><Link href="/terms" className="text-muted hover:text-primary-foreground text-sm">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-muted hover:text-primary-foreground text-sm">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-muted/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted text-sm">
            &copy; {new Date().getFullYear()} Streetly. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-muted text-sm flex items-center gap-1">
              Made with <span className="text-destructive">♥</span> for the world
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
