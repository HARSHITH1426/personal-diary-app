"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, LogIn, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const AUTH_KEY = "core-diary-auth";
const CORRECT_PASSWORD = "abcd1234";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required."),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const authStatus = localStorage.getItem(AUTH_KEY) === "true";
      setIsAuthenticated(authStatus);
      if (authStatus) {
        router.replace('/diary');
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  }, [router]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (values.password === CORRECT_PASSWORD) {
        try {
          localStorage.setItem(AUTH_KEY, "true");
          setIsAuthenticated(true);
          router.push('/diary');
        } catch (error) {
           toast({
            variant: "destructive",
            title: "Authentication failed",
            description: "Could not save authentication status.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "Incorrect password. Please try again.",
        });
      }
      setIsSubmitting(false);
    }, 500);
  };

  if (isAuthenticated === null) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-headline">Core Diary</CardTitle>
          <CardDescription>
            Enter your password to unlock your journal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="pl-8"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Unlock
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
