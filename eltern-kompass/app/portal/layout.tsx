"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home,
  FileText,
  CreditCard,
  LogOut,
  Menu,
  X,
  Baby,
} from "lucide-react";

// Temporärer Auth-Mock - später durch Xano Auth ersetzen
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Prüfe lokalen Auth-Status
    const checkAuth = () => {
      const authData = localStorage.getItem("eltern-kompass-auth");
      if (authData) {
        try {
          const { email, isAuthenticated: auth } = JSON.parse(authData);
          setIsAuthenticated(auth);
          setUserEmail(email);
        } catch {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem("eltern-kompass-auth");
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return { isAuthenticated, userEmail, isLoading, logout };
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, userEmail, isLoading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/registrieren");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    {
      href: "/portal/onboarding",
      label: "Onboarding",
      icon: FileText,
      active: pathname?.startsWith("/portal/onboarding"),
    },
    {
      href: "/portal/ergebnis",
      label: "Dein Ergebnis",
      icon: Home,
      active: pathname === "/portal/ergebnis",
    },
    {
      href: "/portal/strategie",
      label: "Premium Strategie",
      icon: CreditCard,
      active: pathname === "/portal/strategie",
      premium: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Baby className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">Eltern-Kompass</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isSidebarOpen && (
          <nav className="bg-white border-t px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.premium && (
                  <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                )}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Abmelden</span>
            </button>
          </nav>
        )}
      </header>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r">
          <div className="flex items-center gap-2 px-6 py-5 border-b">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Baby className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">Eltern-Kompass</span>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  item.active
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.premium && (
                  <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="px-4 py-4 border-t">
            {userEmail && (
              <p className="text-xs text-muted-foreground mb-3 px-3 truncate">
                {userEmail}
              </p>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Abmelden</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:pl-64 flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
