"use client";

import React, { createContext, useContext, useEffect, useRef, useReducer } from "react";
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
    hasCheckedSession: boolean;
    refreshProfile: () => Promise<void>;
    error: string | null;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    login: async () => { },
    logout: async () => { },
    isLoading: true,
    hasCheckedSession: false,
    refreshProfile: async () => { },
    error: null,
});

export const useAuth = () => useContext(AuthContext);

type AuthState = {
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    hasCheckedSession: boolean;
    error: string | null;
};

type AuthAction =
    | { type: 'START_LOADING' }
    | { type: 'SET_AUTH', user: User | null, profile: Profile | null }
    | { type: 'SET_PROFILE', profile: Profile | null }
    | { type: 'SET_ERROR', error: string | null }
    | { type: 'STOP_LOADING' }
    | { type: 'SET_CHECKED' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'START_LOADING':
            return { ...state, isLoading: true, error: null };
        case 'SET_AUTH':
            return { ...state, user: action.user, profile: action.profile, isLoading: false, hasCheckedSession: true, error: null };
        case 'SET_PROFILE':
            return { ...state, profile: action.profile, isLoading: false, hasCheckedSession: true, error: null };
        case 'SET_ERROR':
            return { ...state, error: action.error, isLoading: false, hasCheckedSession: true };
        case 'STOP_LOADING':
            return { ...state, isLoading: false, hasCheckedSession: true };
        case 'SET_CHECKED':
            return { ...state, hasCheckedSession: true };
        default:
            return state;
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(authReducer, {
        user: null,
        profile: null,
        isLoading: true,
        hasCheckedSession: false,
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
                if (error.code === 'PGRST116') return { data: null, error };

                if (i < retries - 1) await new Promise(r => setTimeout(r, 1000));
            } catch (e) {
                if (i === retries - 1) return { data: null, error: e };
            }
        }
        return { data: null, error: 'Failed' };
    };

    const syncProfile = async (u: User | null) => {
        if (!u) {
            dispatch({ type: 'SET_AUTH', user: null, profile: null });
            lastUserId.current = null;
            return;
        }

        if (syncInProgress.current && lastUserId.current === u.id) return;

        syncInProgress.current = true;
        lastUserId.current = u.id;

        dispatch({ type: 'START_LOADING' });

        const { data, error } = await fetchWithRetry(u.id);

        if (error && error.code !== 'PGRST116') {
            dispatch({ type: 'SET_ERROR', error: "Load failed" });
        } else {
            dispatch({ type: 'SET_AUTH', user: u, profile: data });
        }

        syncInProgress.current = false;
    };

    useEffect(() => {
        let isMounted = true;

        // 1. Give Chrome 1 second to settle storage after redirect
        const initTimer = setTimeout(async () => {
            if (!isMounted) return;

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted) {
                    if (session?.user) {
                        await syncProfile(session.user);
                    } else {
                        dispatch({ type: 'SET_AUTH', user: null, profile: null });
                    }
                }
            } catch (err) {
                console.error("Auth init error:", err);
                if (isMounted) dispatch({ type: 'STOP_LOADING' });
            }

            // 2. Start persistent listener
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (isMounted) {
                    if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
                        await syncProfile(session?.user ?? null);
                    } else if (event === 'SIGNED_OUT') {
                        dispatch({ type: 'SET_AUTH', user: null, profile: null });
                    }
                }
            });

            (window as any)._authSub = subscription;
        }, 1000);

        // 3. Failsafe (12s)
        const failsafeTimer = setTimeout(() => {
            if (isMounted && state.isLoading) {
                console.warn("Auth failsafe: Force stopping load");
                dispatch({ type: 'STOP_LOADING' });
            }
        }, 12000);

        return () => {
            isMounted = false;
            clearTimeout(initTimer);
            clearTimeout(failsafeTimer);
            if ((window as any)._authSub) {
                (window as any)._authSub.unsubscribe();
                delete (window as any)._authSub;
            }
        };
    }, []);

    const login = async (email: string) => { };

    const logout = async () => {
        await supabase.auth.signOut();
        dispatch({ type: 'SET_AUTH', user: null, profile: null });
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
            hasCheckedSession: state.hasCheckedSession,
            login,
            logout,
            refreshProfile,
            error: state.error
        }}>
            {children}
        </AuthContext.Provider>
    );
};
