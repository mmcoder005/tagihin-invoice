import { atom, map } from 'nanostores';

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
  signaturePosition: 'Manajer',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyWebsite: '',
});

export const isStoreReady = atom(false);

export function resetStore() {
  invoiceStore.set({ ...defaultInvoiceState, id: undefined });
}

export function initStore() {
  if (typeof window !== 'undefined') {
    try {
      const savedInvoice = localStorage.getItem('public_invoice');
      if (savedInvoice) invoiceStore.set(JSON.parse(savedInvoice));
      
      const savedBrand = localStorage.getItem('public_brand');
      if (savedBrand) brandStore.set(JSON.parse(savedBrand));
      
      const savedMeta = localStorage.getItem('public_metadata');
      if (savedMeta) metadataStore.set(JSON.parse(savedMeta));
    } catch (e) {
      console.error('Error loading from localStorage', e);
    }
  }
  isStoreReady.set(true);
}

// Persist state to local storage whenever it changes
if (typeof window !== 'undefined') {
  brandStore.listen((val) => {
    localStorage.setItem('public_brand', JSON.stringify(val));
  });

  metadataStore.listen((val) => {
    localStorage.setItem('public_metadata', JSON.stringify(val));
  });

  invoiceStore.listen((val) => {
    localStorage.setItem('public_invoice', JSON.stringify(val));
  });
}
