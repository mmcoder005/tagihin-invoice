import type { APIRoute } from 'astro';
import { Invoice as InvoiceClient } from 'xendit-node';

const xenditSecretKey = import.meta.env.XENDIT_SECRET_KEY;
const xenditInvoiceClient = new InvoiceClient({ secretKey: xenditSecretKey || '' });

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const userId = formData.get('user_id')?.toString();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User not logged in' }), { status: 401 });
    }

    // Create a Xendit Invoice
    const invoiceRequest = {
      externalId: `sub_pro_${userId}_${Date.now()}`,
      amount: 49000,
      description: 'Tagihin Pro - Bulanan (MVP)',
      invoiceDuration: 86400,
      currency: 'IDR',
      customer: {
        referenceId: userId,
      },
      successRedirectUrl: `${new URL(request.url).origin}/dashboard?upgrade=success`,
      failureRedirectUrl: `${new URL(request.url).origin}/dashboard?upgrade=failed`,
    };

    const response = await xenditInvoiceClient.createInvoice({ data: invoiceRequest });

    // Redirect the user to the Xendit Checkout URL
    if (response && response.invoiceUrl) {
      return redirect(response.invoiceUrl, 303);
    }

    return new Response(JSON.stringify({ error: 'Failed to create invoice' }), { status: 500 });
  } catch (error: any) {
    console.error('Xendit Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
