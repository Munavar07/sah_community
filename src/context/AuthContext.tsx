"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useReducer } from "react";
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
    refreshProfile: () => Promise<void>;
    error: string | null;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    login: async () => { },
    logout: async () => { },
    isLoading: true,
    refreshProfile: async () => { },
    error: null,
});

export const useAuth = () => useContext(AuthContext);

type AuthState = {
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    error: string | null;
};

type AuthAction =
    | { type: 'START_LOADING' }
    | { type: 'SET_AUTH', user: User | null, profile: Profile | null }
    | { type: 'SET_PROFILE', profile: Profile | null }
    | { type: 'SET_ERROR', error: string | null }
    | { type: 'STOP_LOADING' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'START_LOADING':
            return { ...state, isLoading: true, error: null };
        case 'SET_AUTH':
            return { ...state, user: action.user, profile: action.profile, isLoading: false, error: null };
        case 'SET_PROFILE':
            return { ...state, profile: action.profile, isLoading: false, error: null };
        case 'SET_ERROR':
            return { ...state, error: action.error, isLoading: false };
        case 'STOP_LOADING':
            return { ...state, isLoading: false };
        default:
            return state;
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(authReducer, {
        user: null,
        profile: null,
        isLoading: true,
        error: null
    });

    const lastUserId = useRef<string | null>(null);
    const syncInProgress = useRef(false);
    const router = useRouter();

    const fetchWithRetry = async (userId: string, retries = 3): Promise<{ data: Profile | null, error: any }> => {
        for (let i = 0; i < retries; i++) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (!error) return { data: data as Profile, error: null };

                // If it's a "Not Found" error, don't retry, just return
                if (error.code === 'PGRST116') return { data: null, error };

                console.warn(`Profile fetch retry ${i + 1}/${retries}...`);
                if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential-ish backoff
            } catch (e) {
                if (i === retries - 1) return { data: null, error: e };
            }
        }
        return { data: null, error: 'Failed after retries' };
    };

    const syncProfile = async (u: User | null) => {
        if (!u) {
            dispatch({ type: 'SET_AUTH', user: null, profile: null });
            lastUserId.current = null;
            return;
        }

        // Avoid concurrent syncs for the same user
        if (syncInProgress.current && lastUserId.current === u.id) return;

        syncInProgress.current = true;
        lastUserId.current = u.id;

        // If we already have the profile, just stop loading (but we usually want to re-verify)
        if (state.profile?.id === u.id && !state.isLoading) {
            syncInProgress.current = false;
            return;
        }

        dispatch({ type: 'START_LOADING' });

        const { data, error } = await fetchWithRetry(u.id);

        if (error && error.code !== 'PGRST116') {
            console.error("Critical profile fetch error:", error);
            dispatch({ type: 'SET_ERROR', error: "Could not load profile. Please check your connection." });
        } else {
            dispatch({ type: 'SET_AUTH', user: u, profile: data });
        }

        syncInProgress.current = false;
    };

    useEffect(() => {
        let isMounted = true;

        // 1. Initial Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted) syncProfile(session?.user ?? null);
        });

        // 2. Auth Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (isMounted) syncProfile(session?.user ?? null);
        });

        // 3. Failsafe (8s)
        const timer = setTimeout(() => {
            if (isMounted) dispatch({ type: 'STOP_LOADING' });
        }, 8000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const login = async (email: string) => {
        // Placeholder
    };

    const logout = async () => {
        await supabase.auth.signOut();
        dispatch({ type: 'SET_AUTH', user: null, profile: null });
        lastUserId.current = null;
        router.push("/login");
    };

    const refreshProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        await syncProfile(user);
    };

    return (
        <AuthContext.Provider value={{
            user: state.user,
            profile: state.profile,
            isLoading: state.isLoading,
            login,
            logout,
            refreshProfile,
            error: state.error
        }}>
            {children}
        </AuthContext.Provider>
    );
};
