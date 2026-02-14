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
        const fetchInProgress = { current: false };

        const handleProfileFetch = async (userId: string) => {
            // If we already have this profile or are fetching it, don't start a new one
            if (profile?.id === userId || fetchInProgress.current) {
                return;
            }

            fetchInProgress.current = true;
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
                        lastUserId.current = userId;
                    }
                }
            } catch (err) {
                console.error("Critical Profile Fetch failure:", err);
                if (isMounted) setProfile(null);
            } finally {
                fetchInProgress.current = false;
                if (isMounted) setIsLoading(false);
            }
        };

        // 1. Initial Session Check
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
            // If the user changed or profile is missing, fetch it
            if (lastUserId.current !== currentUser.id) {
                await handleProfileFetch(currentUser.id);
            }
        });

        // 3. Failsafe Timeout (increased to 8s for reliability)
        const timer = setTimeout(() => {
            if (isMounted) setIsLoading(false);
        }, 8000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(timer);
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
