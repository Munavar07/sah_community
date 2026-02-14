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
    const [authState, setAuthState] = useState<{
        user: User | null;
        profile: Profile | null;
        isLoading: boolean;
    }>({
        user: null,
        profile: null,
        isLoading: true,
    });

    const lastUserId = useRef<string | null>(null);
    const fetchInProgress = useRef(false);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const syncProfile = async (u: User | null) => {
            if (!u) {
                if (isMounted) {
                    setAuthState({ user: null, profile: null, isLoading: false });
                    lastUserId.current = null;
                }
                return;
            }

            // If we are already mid-fetch for this user, don't start another
            if (fetchInProgress.current && lastUserId.current === u.id) return;

            fetchInProgress.current = true;
            lastUserId.current = u.id;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', u.id)
                    .single();

                if (isMounted) {
                    if (error) {
                        console.error("Profile fetch error:", error);
                        setAuthState({ user: u, profile: null, isLoading: false });
                    } else {
                        setAuthState({ user: u, profile: data as Profile, isLoading: false });
                    }
                }
            } catch (err) {
                console.error("Critical Profile sync failure:", err);
                if (isMounted) setAuthState({ user: u, profile: null, isLoading: false });
            } finally {
                fetchInProgress.current = false;
            }
        };

        // 1. Initial Load
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted) {
                if (session?.user) {
                    syncProfile(session.user);
                } else {
                    setAuthState({ user: null, profile: null, isLoading: false });
                }
            }
        });

        // 2. Auth Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (isMounted) {
                syncProfile(session?.user ?? null);
            }
        });

        // 3. Failsafe (increased to 8s)
        const timer = setTimeout(() => {
            if (isMounted) {
                setAuthState(prev => ({ ...prev, isLoading: false }));
            }
        }, 8000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const login = async (email: string) => {
        // Implementation placeholder
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setAuthState({ user: null, profile: null, isLoading: false });
        lastUserId.current = null;
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{
            user: authState.user,
            profile: authState.profile,
            isLoading: authState.isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};
