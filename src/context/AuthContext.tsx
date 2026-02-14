"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types";
import { useRouter } from "next/navigation";

type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    login: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    login: async () => { },
    logout: async () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const lastUserId = useRef<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const handleProfileFetch = async (userId: string) => {
            if (lastUserId.current === userId) {
                if (isMounted) setIsLoading(false);
                return;
            }

            lastUserId.current = userId;
            if (isMounted) setIsLoading(true);

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (isMounted) {
                    if (error) {
                        console.error("Profile fetch error:", error);
                        setProfile(null);
                    } else {
                        setProfile(data as Profile);
                    }
                }
            } catch (err) {
                console.error("Critical Profile Fetch failure:", err);
                if (isMounted) setProfile(null);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        // 1. Initial Session Check (Standard for reliable mount state)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!isMounted) return;
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                handleProfileFetch(currentUser.id);
            } else {
                setIsLoading(false);
            }
        });

        // 2. Auth State Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;

            if (!currentUser) {
                if (isMounted) {
                    setUser(null);
                    setProfile(null);
                    lastUserId.current = null;
                    setIsLoading(false);
                }
                return;
            }

            setUser(currentUser);
            await handleProfileFetch(currentUser.id);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string) => {
        // For this app, providing a simple way to sign in.
        // In reality, users should use Magic Link or Password.
        // We will assume Magic Link for simplicity of implementation or 
        // let the user handle the strict auth flow on the dedicated page.

        // This function is mainly a placeholder for the context consumer interaction
        // The actual login happens in the Login page components.
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, profile, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
