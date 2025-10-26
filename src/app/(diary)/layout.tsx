"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FilePlus2,
  Home,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react";

import { useDiaryStore } from "@/hooks/use-diary-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const AUTH_KEY = "core-diary-auth";

function useAppAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const authStatus = localStorage.getItem(AUTH_KEY) === "true";
      setIsAuthenticated(authStatus);
      if (!authStatus) {
        router.push("/login");
      }
    } catch (error) {
      setIsAuthenticated(false);
      router.push("/login");
    }
  }, [router]);
  
  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return { isAuthenticated, logout };
}


function ThemeToggle() {
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined') return 'light';
        return localStorage.getItem('theme') || 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { searchTerm, selectedDate, tags, actions } = useDiaryStore(state => ({
    searchTerm: state.searchTerm,
    selectedDate: state.selectedDate,
    tags: state.tags,
    actions: state.actions
  }));
  const pathname = usePathname();
  const { logout } = useAppAuth();
  
  const handleLinkClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <Link href="/diary" className="text-2xl font-bold font-headline" onClick={handleLinkClick}>Core Diary</Link>
      </div>
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        <Link href="/diary/entry/new">
          <Button className="w-full" onClick={handleLinkClick}><FilePlus2 className="mr-2 h-4 w-4" /> New Entry</Button>
        </Link>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search entries..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => actions.setSearchTerm(e.target.value)}
          />
        </div>
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-2">Navigation</h3>
            <Link href="/diary" passHref>
                <Button variant={pathname === '/diary' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={handleLinkClick}>
                    <Home className="mr-2 h-4 w-4" />
                    All Entries
                </Button>
            </Link>
            <Link href="/diary/settings" passHref>
                <Button variant={pathname === '/diary/settings' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={handleLinkClick}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                </Button>
            </Link>
        </div>
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={actions.setSelectedDate}
            className="rounded-md border"
            classNames={{
                caption_label: "font-headline",
            }}
          />
        </div>
        {tags.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge 
                  key={tag}
                  variant="secondary" 
                  className="cursor-pointer"
                  onClick={() => actions.setSearchTerm(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </nav>
      <div className="p-4 border-t flex justify-between items-center">
        <ThemeToggle />
        <Button variant="ghost" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );
}

export default function DiaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAppAuth();
  const { actions, initialized } = useDiaryStore(state => ({ actions: state.actions, initialized: state.initialized }));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!initialized) {
      actions.initialize();
    }
  }, [initialized, actions]);


  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full md:grid md:grid-cols-[280px_1fr]">
      <div className="hidden md:block border-r">
        <SidebarNav />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6 md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-full max-w-xs">
              <SidebarNav onNavigate={() => setMobileMenuOpen(false)}/>
            </SheetContent>
          </Sheet>
          <Link href="/diary" className="text-lg font-bold font-headline">Core Diary</Link>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/40">
            {children}
        </main>
      </div>
    </div>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="4" x2="20" y1="12" y2="12" />
        <line x1="4" x2="20" y1="6" y2="6" />
        <line x1="4" x2="20" y1="18" y2="18" />
      </svg>
    )
  }
