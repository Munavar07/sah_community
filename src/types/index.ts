export type Profile = {
    id: string;
    email: string | null;
    role: 'leader' | 'member';
    full_name: string | null;
    created_at: string;
    referrer_id?: string | null;
    category?: string;
};

export type Investment = {
    id: string;
    member_id: string;
    amount: number;
    proof_url: string | null;
    status: 'pending' | 'active' | 'completed';
    start_date: string;
    created_at: string;
    profiles?: Profile; // Joined data
};

export type DailyLog = {
    id: string;
    member_id: string;
    profit_amount: number;
    screenshot_url: string | null;
    log_date: string;
    created_at: string;
    profiles?: Profile; // Joined data
};
