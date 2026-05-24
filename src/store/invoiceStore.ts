import { atom, map } from 'nanostores';
import { supabase } from '../lib/supabase';
import { debounce } from 'lodash-es';

export interface LineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
}

export interface BrandState {
  primaryColor: string;
  headerColor: string;
  mutedColor: string;
  logoBase64: string;
  fontBase64: string;
}

export interface InvoiceData {
  id?: string;
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  date: string;
  dueDate: string;
  lineItems: LineItem[];
  taxRate: number;
  discount: number;
  shipping: number;
  notes: string;
}

export interface Metadata {
  companyName: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  accountName: string;
  npwp: string;
  signatureName: string;
  signaturePosition: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
}

export const brandStore = map<BrandState>({
  primaryColor: '#30a9b1',
  headerColor: '#20324c',
  mutedColor: '#f6f9fc',
  logoBase64: '',
  fontBase64: '',
});

const defaultInvoiceState: InvoiceData = {
  invoiceNumber: 'INV-0001',
  clientName: '',
  clientAddress: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  lineItems: [{ id: '1', name: '', description: '', quantity: 1, rate: 0, discount: 0 }],
  taxRate: 0,
  discount: 0,
  shipping: 0,
  notes: '',
};

export const invoiceStore = map<InvoiceData>({ ...defaultInvoiceState });

export const metadataStore = map<Metadata>({
  companyName: '',
  bankName: '',
  branch: '',
  accountNumber: '',
  accountName: '',
  npwp: '',
  signatureName: 'Tanda Tangan',
  signaturePosition: 'Direktur',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyWebsite: '',
});

export const isStoreReady = atom(false);
export const isSaving = atom(false);
export const isPublicStore = atom(false);

export function resetStore() {
  invoiceStore.set({ ...defaultInvoiceState, id: undefined });
}

export async function initStore(invoiceId?: string, isPublic?: boolean) {
  try {
    isPublicStore.set(!!isPublic);
    if (isPublic) {
      if (typeof window !== 'undefined') {
        const savedInvoice = localStorage.getItem('public_invoice');
        if (savedInvoice) invoiceStore.set(JSON.parse(savedInvoice));
        const savedBrand = localStorage.getItem('public_brand');
        if (savedBrand) brandStore.set(JSON.parse(savedBrand));
        const savedMeta = localStorage.getItem('public_metadata');
        if (savedMeta) metadataStore.set(JSON.parse(savedMeta));
      }
      isStoreReady.set(true);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      isStoreReady.set(true);
      return;
    }

    // Load Profile Data
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      brandStore.set({
        primaryColor: profile.primary_color || '#2563eb',
        headerColor: profile.header_color || '#1e293b',
        mutedColor: profile.muted_color || '#f8fafc',
        logoBase64: profile.logo_base64 || '',
        fontBase64: profile.font_base64 || '',
      });
      metadataStore.set({
        companyName: profile.company_name || '',
        bankName: profile.bank_name || '',
        branch: profile.branch || '',
        accountNumber: profile.account_number || '',
        accountName: profile.account_name || '',
        npwp: profile.npwp || '',
        signatureName: profile.signature_name || '',
        signaturePosition: profile.signature_position || '',
        companyAddress: profile.company_address || '',
        companyPhone: profile.company_phone || '',
        companyEmail: profile.company_email || '',
        companyWebsite: profile.company_website || '',
      });
    }

    // Load Invoice Data
    if (invoiceId) {
      const { data: invoice } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
      if (invoice) {
        const { data: items } = await supabase.from('line_items').select('*').eq('invoice_id', invoiceId);
        
        invoiceStore.set({
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          clientName: invoice.client_name || '',
          clientAddress: invoice.client_address || '',
          date: invoice.date || '',
          dueDate: invoice.due_date || '',
          taxRate: Number(invoice.tax_rate) || 0,
          discount: Number(invoice.discount) || 0,
          shipping: Number(invoice.shipping) || 0,
          notes: invoice.notes || '',
          lineItems: items?.map(i => ({
            id: i.id,
            name: i.name || '',
            description: i.description || '',
            quantity: Number(i.quantity),
            rate: Number(i.rate),
            discount: Number(i.discount),
          })) || defaultInvoiceState.lineItems,
        });
      }
    }
  } catch (err) {
    console.error('Failed to load data from Supabase', err);
  } finally {
    isStoreReady.set(true);
  }
}

// Debounced Save Functions
const saveProfileToSupabase = debounce(async () => {
  if (!isStoreReady.get()) return;
  
  if (isPublicStore.get()) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('public_brand', JSON.stringify(brandStore.get()));
      localStorage.setItem('public_metadata', JSON.stringify(metadataStore.get()));
    }
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const b = brandStore.get();
  const m = metadataStore.get();

  await supabase.from('profiles').update({
    primary_color: b.primaryColor,
    header_color: b.headerColor,
    muted_color: b.mutedColor,
    logo_base64: b.logoBase64,
    font_base64: b.fontBase64,
    company_name: m.companyName,
    bank_name: m.bankName,
    branch: m.branch,
    account_number: m.accountNumber,
    account_name: m.accountName,
    npwp: m.npwp,
    signature_name: m.signatureName,
    signature_position: m.signaturePosition,
    company_address: m.companyAddress,
    company_phone: m.companyPhone,
    company_email: m.companyEmail,
    company_website: m.companyWebsite,
  }).eq('id', user.id);
}, 2000);

const saveInvoiceToSupabase = debounce(async () => {
  if (!isStoreReady.get()) return;

  if (isPublicStore.get()) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('public_invoice', JSON.stringify(invoiceStore.get()));
    }
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  isSaving.set(true);
  const inv = invoiceStore.get();
  
  try {
    let invoiceId = inv.id;

    const invoiceData = {
      user_id: user.id,
      invoice_number: inv.invoiceNumber,
      client_name: inv.clientName,
      client_address: inv.clientAddress,
      date: inv.date,
      due_date: inv.dueDate,
      tax_rate: inv.taxRate,
      discount: inv.discount,
      shipping: inv.shipping,
      notes: inv.notes,
      updated_at: new Date().toISOString(),
    };

    if (invoiceId) {
      await supabase.from('invoices').update(invoiceData).eq('id', invoiceId);
    } else {
      const { data } = await supabase.from('invoices').insert([invoiceData]).select().single();
      if (data) {
        invoiceId = data.id;
        invoiceStore.setKey('id', invoiceId); // Update store with new ID
      }
    }

    // Handle line items (delete old, insert new for simplicity in MVP)
    if (invoiceId) {
      await supabase.from('line_items').delete().eq('invoice_id', invoiceId);
      
      const itemsToInsert = inv.lineItems.map(item => ({
        invoice_id: invoiceId,
        user_id: user.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        discount: item.discount,
      }));
      
      await supabase.from('line_items').insert(itemsToInsert);
    }
  } catch (err) {
    console.error('Error saving invoice', err);
  } finally {
    isSaving.set(false);
  }
}, 2000);

brandStore.listen(saveProfileToSupabase);
metadataStore.listen(saveProfileToSupabase);
invoiceStore.listen(saveInvoiceToSupabase);
