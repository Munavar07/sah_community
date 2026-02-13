"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function createMemberAction(prevState: unknown, formData: FormData) {
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
    const proofFile = formData.get("proof") as File;

    let proofUrl = "";

    try {
        // 1. Upload Proof (Admin API - No RLS)
        if (proofFile && proofFile.size > 0) {
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `admin-upload-${Date.now()}.${fileExt}`;
            const arrayBuffer = await proofFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabaseAdmin.storage
                .from('proofs')
                .upload(fileName, buffer, {
                    contentType: proofFile.type,
                    upsert: true
                });

            if (uploadError) throw new Error("Upload failed: " + uploadError.message);

            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('proofs')
                .getPublicUrl(fileName);

            proofUrl = publicUrl;
        }

        // 2. Create Auth User (Admin API - No Rate Limits)
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

        // 4. Handle Referral Commission (5%)
        if (uplineId && uplineId !== "none") {
            const commissionAmount = amount * 0.05;
            const { error: commissionError } = await supabaseAdmin
                .from('commissions')
                .insert({
                    referrer_id: uplineId,
                    member_id: userId,
                    amount: commissionAmount,
                    type: 'referral'
                });

            if (commissionError) {
                console.error("Referral Commission Error:", commissionError);
                // We don't throw here to avoid failing member creation just for commission record
            }
        }

        revalidatePath("/dashboard/network");
        return { success: true, message: `Success! Member ${fullName} created.` };

    } catch (err: unknown) {
        const error = err as Error;
        console.error("Create Member Error:", error);
        return { success: false, message: `Error: ${error.message}` };
    }
}

export async function logProfitAction(prevState: unknown, formData: FormData) {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            return { success: false, message: "Server Error: Missing Database Configuration" };
        }

        const supabaseAdmin = createClient(url, key, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const userId = formData.get("userId") as string;
        const profit = parseFloat(formData.get("profit") as string);
        const proofFile = formData.get("proof") as File;

        if (!userId || userId.length < 32) {
            return { success: false, message: "Invalid User session. Please log in again." };
        }

        if (isNaN(profit)) {
            return { success: false, message: "Invalid profit amount entered." };
        }

        if (!proofFile || proofFile.size === 0) {
            return { success: false, message: "A result screenshot is required." };
        }

        // 1. Upload to Storage
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const arrayBuffer = await proofFile.arrayBuffer();

        const { error: uploadError } = await supabaseAdmin.storage
            .from('results')
            .upload(fileName, Buffer.from(arrayBuffer), {
                contentType: proofFile.type,
                upsert: true
            });

        if (uploadError) {
            return { success: false, message: `Upload Error: ${uploadError.message}` };
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('results')
            .getPublicUrl(fileName);

        // 2. Insert into DB
        const today = new Date().toISOString().split('T')[0];

        const { error: dbError } = await supabaseAdmin
            .from('daily_logs')
            .insert({
                member_id: userId,
                profit_amount: profit,
                screenshot_url: publicUrl,
                log_date: today
            });

        if (dbError) {
            return { success: false, message: `Database Error: ${dbError.message}` };
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/gallery");

        return { success: true, message: "Success! Daily profit logged." };

    } catch (err: unknown) {
        const error = err as Error;
        console.error("CRITICAL ACTION ERROR:", error);
        return { success: false, message: "Critical Server Error. Please try again later." };
    }
}

