"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types";
import { useRouter } from "next/navigation";

type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    login: (email: string) => Promise<void>; // Simplified for magic link or just email for now
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
    const router = useRouter();

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
                // If error code is 'PGRST116' (JSON object returned 0 results), it means profile doesn't exist.
                // We should allow the app to load so we can perhaps show a "Complete Profile" screen.
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
