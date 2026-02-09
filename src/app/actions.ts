"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function createMemberAction(prevState: any, formData: FormData) {
    if (!serviceRoleKey) {
        return { success: false, message: "Server Error: Missing Service Role Key" };
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const category = formData.get("category") as string;
    const uplineId = formData.get("uplineId") as string;
    // We can't handle file upload directly in server action easily without extra setup in this environment
    // So we will handle file upload on client, get URL, then pass URL here.
    const proofUrl = formData.get("proofUrl") as string;

    try {
        // 1. Create Auth User (Admin API - No Rate Limits)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto confirm so they can login immediately
            user_metadata: {
                full_name: fullName,
                role: 'member'
            }
        });

        if (authError) throw authError;
        const userId = authData.user.id;

        // 2. Upsert Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                email,
                full_name: fullName,
                role: 'member',
                referrer_id: uplineId || null,
                category,
                updated_at: new Date().toISOString()
            });

        if (profileError) throw profileError;

        // 3. Create Investment Record
        const { error: investError } = await supabaseAdmin
            .from('investments')
            .insert({
                member_id: userId,
                amount: amount,
                status: 'active',
                proof_url: proofUrl,
                start_date: new Date().toISOString()
            });

        if (investError) throw investError;

        revalidatePath("/dashboard/network");
        return { success: true, message: `Success! Member ${fullName} created.` };

    } catch (err: any) {
        console.error("Create Member Error:", err);
        return { success: false, message: `Error: ${err.message}` };
    }
}
