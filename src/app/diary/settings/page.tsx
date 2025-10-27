"use client";

import { useTheme, type Theme } from "@/hooks/use-theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
    { name: 'Teal', class: 'theme-teal', color: 'bg-teal-500' },
    { name: 'Rose', class: 'theme-rose', color: 'bg-rose-500' },
    { name: 'Blue', class: 'theme-blue', color: 'bg-blue-500' },
];

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
                        <Palette className="h-6 w-6" />
                        Appearance
                    </CardTitle>
                    <CardDescription>
                        Customize the look and feel of your diary. Select a theme below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {themes.map((t) => (
                            <div key={t.name}>
                                <button
                                    onClick={() => setTheme(t.class as Theme)}
                                    className={cn(
                                        "w-full rounded-md border-2 p-2 flex items-center justify-center transition-all",
                                        theme === t.class ? "border-primary" : "border-transparent"
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", t.color)}>
                                            {theme === t.class && <Check className="h-6 w-6 text-white" />}
                                        </div>
                                        <span className="text-sm font-medium text-foreground">{t.name}</span>
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* You can add more settings cards here in the future! */}
            {/* 
            <Card>
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Account settings...</p>
                </CardContent>
            </Card> 
            */}
        </div>
    );
}
