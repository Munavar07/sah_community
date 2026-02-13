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
        // Checking session on mount to prevent flash
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                if (lastUserId.current !== session.user.id) {
                    lastUserId.current = session.user.id;
                    await fetchProfile(session.user.id);
                }
            } else {
                setIsLoading(false);
            }
        };
        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                // Prevent redundant fetches (e.g. on TOKEN_REFRESH)
                if (lastUserId.current !== currentUser.id) {
                    lastUserId.current = currentUser.id;
                    await fetchProfile(currentUser.id);
                }
            } else {
                lastUserId.current = null;
                setProfile(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
            } else {
                setProfile(data as Profile);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

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
