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

    const lastSyncUserId = useRef<string | null>(null);
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
            lastSyncUserId.current = null;
            return;
        }

        if (syncInProgress.current && lastSyncUserId.current === u.id) return;

        syncInProgress.current = true;
        lastSyncUserId.current = u.id;

        dispatch({ type: 'START_LOADING' });

        const { data, error } = await fetchWithRetry(u.id);

        if (error && error.code !== 'PGRST116') {
            dispatch({ type: 'SET_ERROR', error: "Profile Load failed" });
        } else {
            dispatch({ type: 'SET_AUTH', user: u, profile: data });
        }

        syncInProgress.current = false;
    };

    useEffect(() => {
        let isMounted = true;
        const confirmedUser = { current: false };

        // 1. Initial listener - MUST be active immediately to catch quick login events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
                confirmedUser.current = true;
                await syncProfile(session?.user ?? null);
            } else if (event === 'SIGNED_OUT') {
                confirmedUser.current = false;
                dispatch({ type: 'SET_AUTH', user: null, profile: null });
            }
        });

        // 2. Initial Session Check (Immediate)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted && session?.user) {
                confirmedUser.current = true;
                syncProfile(session.user);
            }
        });

        // 3. The "Chrome Guard": Wait 1.5 seconds before declaring "Logged Out" 
        // if no session was found by either the listener or getSession.
        const chromeGuardTimer = setTimeout(() => {
            if (isMounted && !confirmedUser.current) {
                // If after 1.5s we still don't have a user, definitively declare we are logged out.
                dispatch({ type: 'SET_AUTH', user: null, profile: null });
            }
        }, 1500);

        // 4. Global Failsafe (emergency exit)
        const failsafeTimer = setTimeout(() => {
            if (isMounted && state.isLoading) {
                dispatch({ type: 'STOP_LOADING' });
            }
        }, 12000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(chromeGuardTimer);
            clearTimeout(failsafeTimer);
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
