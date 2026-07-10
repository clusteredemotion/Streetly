import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { BottomTabBar } from "./BottomTabBar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col pb-12 md:pb-0">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomTabBar />
    </div>
  );
}
