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

        revalidatePath("/dashboard/network");
        return { success: true, message: `Success! Member ${fullName} created.` };

    } catch (err: any) {
        console.error("Create Member Error:", err);
        return { success: false, message: `Error: ${err.message}` };
    }
}

export async function logProfitAction(prevState: any, formData: FormData) {
    if (!serviceRoleKey) {
        return { success: false, message: "Server Error: Missing Service Role Key in Environment" };
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const userId = formData.get("userId") as string;
    const profitStr = formData.get("profit") as string;
    const profit = parseFloat(profitStr);
    const proofFile = formData.get("proof") as File;

    if (!userId) return { success: false, message: "User session not found. Please re-login." };
    if (isNaN(profit)) return { success: false, message: "Invalid profit amount." };

    try {
        let screenshotUrl = "";

        // 1. Upload Screenshot
        if (proofFile && proofFile.size > 0) {
            // Body limit check for Vercel (4.5MB)
            if (proofFile.size > 4 * 1024 * 1024) {
                return { success: false, message: "File too large. Max 4MB allowed." };
            }

            const fileExt = proofFile.name.split('.').pop();
            const fileName = `${userId}-log-${Date.now()}.${fileExt}`;
            const arrayBuffer = await proofFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabaseAdmin.storage
                .from('results')
                .upload(fileName, buffer, {
                    contentType: proofFile.type,
                    upsert: true
                });

            if (uploadError) {
                console.error("Upload Error:", uploadError);
                return { success: false, message: `Upload failed: ${uploadError.message}. Ensure 'results' bucket exists.` };
            }

            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('results')
                .getPublicUrl(fileName);

            screenshotUrl = publicUrl;
        } else {
            return { success: false, message: "Screenshot is required" };
        }

        // 2. Insert Log
        const todayDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

        const { error: dbError } = await supabaseAdmin
            .from('daily_logs')
            .insert({
                member_id: userId,
                profit_amount: profit,
                screenshot_url: screenshotUrl,
                log_date: todayDate
            });

        if (dbError) {
            console.error("DB Error:", dbError);
            return { success: false, message: `Database error: ${dbError.message}` };
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/gallery");
        return { success: true, message: "Success! Daily profit logged." };

    } catch (err: any) {
        console.error("Unexpected Action Error:", err);
        return { success: false, message: `Action Error: ${err.message || "Unknown error occurred"}` };
    }
}

