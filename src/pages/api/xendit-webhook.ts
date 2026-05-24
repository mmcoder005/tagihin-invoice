import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
// Use service role key to bypass RLS for webhook updates, fallback to anon key
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();

    // Verify webhook payload
    const { status, external_id } = payload;
    
    // Check if it's a paid Tagihin Pro invoice
    if (status === 'PAID' && external_id && external_id.startsWith('sub_pro_')) {
      // Extract user_id from external_id (format: sub_pro_{userId}_{timestamp})
      const parts = external_id.split('_');
      if (parts.length >= 3) {
        const userId = parts[2];
        
        // Update user profile to Pro
        const { error } = await supabase
          .from('profiles')
          .update({ is_pro: true })
          .eq('id', userId);
          
        if (error) {
          console.error('Failed to update profile to Pro:', error);
          return new Response(JSON.stringify({ error: 'Failed to update profile' }), { status: 500 });
        }
        
        console.log(`Successfully upgraded user ${userId} to Pro`);
      }
    }

    return new Response(JSON.stringify({ message: 'Webhook received' }), { status: 200 });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
