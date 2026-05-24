import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font, Link } from '@react-pdf/renderer';
import { translations, Language } from './i18n';

// Formatter helper
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#334155'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40
  },
  logo: {
    height: 50,
    objectFit: 'contain'
  },
  logoPlaceholder: {
    height: 50,
    color: '#94a3b8',
    fontStyle: 'italic',
    justifyContent: 'center'
  },
  titleBlock: {
    alignItems: 'flex-end',
    textAlign: 'right'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'right'
  },
  refTable: {
    width: 200,
    marginLeft: 'auto'
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4
  },
  refLabel: {
    color: '#475569',
    marginRight: 15,
    textAlign: 'right'
  },
  refValue: {
    fontWeight: 'bold',
    textAlign: 'right',
    width: 100
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40
  },
  infoCol: {
    width: '45%'
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4
  },
  divider: {
    borderBottomWidth: 1,
    marginBottom: 8
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4
  },
  infoText: {
    marginBottom: 2,
    color: '#475569'
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    paddingBottom: 8,
    marginBottom: 8
  },
  thCol1: { flex: 1, fontWeight: 'bold' },
  thCol2: { width: 65, textAlign: 'center', fontWeight: 'bold' },
  thCol3: { width: 80, textAlign: 'right', fontWeight: 'bold' },
  thColDiscount: { width: 60, textAlign: 'right', fontWeight: 'bold' },
  thColLast: { width: 90, textAlign: 'right', fontWeight: 'bold' },
  tr: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  tdCol1: { flex: 1, paddingRight: 10 },
  itemName: { fontWeight: 'bold', marginBottom: 2 },
  itemDesc: { color: '#475569', fontSize: 9 },
  tdCol2: { width: 65, textAlign: 'center' },
  tdCol3: { width: 80, textAlign: 'right' },
  tdColDiscount: { width: 60, textAlign: 'right', color: '#dc2626' },
  tdColLast: { width: 90, textAlign: 'right', fontWeight: 'bold' },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    alignItems: 'flex-end'
  },
  paymentBox: {
    width: '45%',
    padding: 12,
    borderRadius: 4
  },
  paymentTitle: {
    fontWeight: 'bold',
    marginBottom: 6
  },
  totalsBox: {
    width: '35%'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 4,
    borderTopWidth: 1.5
  },
  finalTotalText: {
    fontWeight: 'bold',
    fontSize: 14
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end'
  },
  meteraiBox: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    padding: 4
  },
  meteraiText: {
    fontSize: 7,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  sigBox: {
    width: 150,
    textAlign: 'center'
  },
  sigLine: {
    borderBottomWidth: 1,
    borderColor: '#000',
    marginBottom: 4,
    marginTop: 50
  },
  sigName: {
    fontWeight: 'bold'
  },
  sigRole: {
    fontSize: 8,
    color: '#64748b'
  },
  notesBox: {
    marginTop: 30,
    fontSize: 8,
    color: '#64748b'
  },
  watermark: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center'
  },
  watermarkText: {
    fontSize: 8,
    color: '#94a3b8',
    marginBottom: 8
  },
  watermarkLogo: {
    height: 16,
    opacity: 0.5
  }
});

export const InvoicePDF = ({ invoice, brand, metadata, lang = 'id' }: any) => {
  const t = translations[lang as Language];
  const hasItemDiscounts = invoice.lineItems.some((i: any) => i.discount > 0);
  
  const subtotal = invoice.lineItems.reduce((sum: number, item: any) => {
    return sum + Math.max(0, (item.quantity * item.rate) - (item.discount || 0));
  }, 0);
  const taxAmount = (subtotal * invoice.taxRate) / 100;
  const total = subtotal + taxAmount - invoice.discount + invoice.shipping;

  const primaryColor = brand.primaryColor || '#30a9b1';
  const headerColor = brand.headerColor || '#1e293b';
  const mutedColor = brand.mutedColor || '#f8fafc';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Header */}
        <View style={styles.headerRow} fixed>
          <View>
            {brand.logoBase64 ? (
              <Image src={brand.logoBase64} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}><Text>{t.logoPlaceholderPreview}</Text></View>
            )}
          </View>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: primaryColor }]}>{t.invoice}</Text>
            <View style={styles.refTable}>
              <View style={styles.refRow}>
                <Text style={styles.refLabel}>{t.reference}</Text>
                <Text style={styles.refValue}>{invoice.invoiceNumber || 'INV-XXXX'}</Text>
              </View>
              <View style={styles.refRow}>
                <Text style={styles.refLabel}>{t.date}</Text>
                <Text style={styles.refValue}>{invoice.date || '-'}</Text>
              </View>
              {invoice.dueDate && (
                <View style={styles.refRow}>
                  <Text style={styles.refLabel}>{t.dueDate}</Text>
                  <Text style={styles.refValue}>{invoice.dueDate}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid} fixed>
          <View style={styles.infoCol}>
            <Text style={[styles.sectionTitle, { color: headerColor }]}>{t.companyInfo}</Text>
            <View style={[styles.divider, { borderBottomColor: headerColor }]} />
            {metadata.companyName && (
              <Text style={[styles.companyName, { color: primaryColor }]}>{metadata.companyName}</Text>
            )}
            <View>
              {metadata.companyAddress && <Text style={styles.infoText}>{metadata.companyAddress}</Text>}
              {metadata.companyPhone && <Text style={styles.infoText}>Tel: {metadata.companyPhone}</Text>}
              {metadata.companyEmail && <Text style={styles.infoText}>Email: {metadata.companyEmail}</Text>}
              {metadata.companyWebsite && <Text style={styles.infoText}>Web: {metadata.companyWebsite}</Text>}
              {metadata.npwp && <Text style={[styles.infoText, { color: headerColor, marginTop: 4, fontWeight: 'bold' }]}>{lang === 'en' ? 'Tax ID' : 'NPWP'}: {metadata.npwp}</Text>}
            </View>
          </View>
          <View style={styles.infoCol}>
            <Text style={[styles.sectionTitle, { color: headerColor }]}>{t.billTo}</Text>
            <View style={[styles.divider, { borderBottomColor: headerColor }]} />
            <Text style={[styles.companyName, { color: primaryColor }]}>{invoice.clientName || (lang === 'en' ? 'Client Name' : 'Nama Klien')}</Text>
            {invoice.clientAddress && <Text style={styles.infoText}>{invoice.clientAddress}</Text>}
          </View>
        </View>

        {/* Table Header */}
        <View style={[styles.tableHeader, { borderBottomColor: primaryColor }]}>
          <Text style={[styles.thCol1, { color: headerColor }]}>{t.itemDescription}</Text>
          <Text style={[styles.thCol2, { color: headerColor }]}>{t.quantity}</Text>
          <Text style={[styles.thCol3, { color: headerColor }]}>{t.unitPrice}</Text>
          {hasItemDiscounts && <Text style={[styles.thColDiscount, { color: headerColor }]}>{t.discount}</Text>}
          <Text style={[styles.thColLast, { color: headerColor }]}>{t.amount}</Text>
        </View>

        {/* Table Items */}
        {invoice.lineItems.map((item: any, i: number) => {
          const lineTotal = Math.max(0, (item.quantity * item.rate) - (item.discount || 0));
          const isEven = i % 2 === 0;
          return (
            <View key={i} style={[styles.tr, { backgroundColor: isEven ? '#ffffff' : mutedColor }]} wrap={false}>
              <View style={styles.tdCol1}>
                {item.name ? <Text style={styles.itemName}>{item.name}</Text> : null}
                {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
                {!item.name && !item.description && <Text style={styles.itemDesc}>...</Text>}
              </View>
              <Text style={styles.tdCol2}>{item.quantity}</Text>
              <Text style={styles.tdCol3}>{formatIDR(item.rate)}</Text>
              {hasItemDiscounts && (
                <Text style={styles.tdColDiscount}>
                  {item.discount ? `-${formatIDR(item.discount)}` : '-'}
                </Text>
              )}
              <Text style={styles.tdColLast}>{formatIDR(lineTotal)}</Text>
            </View>
          );
        })}

        {/* Footer */}
        <View wrap={false}>
          <View style={styles.footerSection}>
            <View style={[styles.paymentBox, { backgroundColor: mutedColor }]}>
              <Text style={[styles.paymentTitle, { color: headerColor }]}>{t.paymentInfo.toUpperCase()}</Text>
              <Text style={styles.infoText}>Bank: {metadata.bankName} {metadata.branch && `(${metadata.branch})`}</Text>
              <Text style={styles.infoText}>{lang === 'en' ? 'Acc No:' : 'No. Rekening:'} {metadata.accountNumber}</Text>
              <Text style={styles.infoText}>{lang === 'en' ? 'Acc Name:' : 'A/N:'} {metadata.accountName}</Text>
            </View>

            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={{ color: headerColor }}>{t.subtotal}</Text>
                <Text>{formatIDR(subtotal)}</Text>
              </View>
              {invoice.taxRate > 0 && (
                <View style={styles.totalRow}>
                  <Text style={{ color: headerColor }}>{t.tax} ({invoice.taxRate}%)</Text>
                  <Text>{formatIDR(taxAmount)}</Text>
                </View>
              )}
              {invoice.discount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={{ color: headerColor }}>{t.discount}</Text>
                  <Text style={{ color: '#dc2626' }}>-{formatIDR(invoice.discount)}</Text>
                </View>
              )}
              {invoice.shipping > 0 && (
                <View style={styles.totalRow}>
                  <Text style={{ color: headerColor }}>{t.shipping}</Text>
                  <Text>{formatIDR(invoice.shipping)}</Text>
                </View>
              )}
              <View style={[styles.finalTotalRow, { borderTopColor: primaryColor }]}>
                <Text style={[styles.finalTotalText, { color: primaryColor }]}>{t.total}</Text>
                <Text style={[styles.finalTotalText, { color: primaryColor }]}>{formatIDR(total)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.signatureSection}>
            {metadata.hasMeterai && (
              <View style={styles.meteraiBox}>
                <Text style={styles.meteraiText}>{lang === 'en' ? 'Duty Stamp Rp 10.000' : 'Tempel Meterai Rp 10.000 di sini'}</Text>
              </View>
            )}
            <View style={styles.sigBox}>
              <Text style={{ color: headerColor }}>{lang === 'en' ? 'Sincerely,' : 'Dengan Hormat,'}</Text>
              <View style={styles.sigLine} />
              <Text style={[styles.sigName, { color: headerColor }]}>{metadata.signatureName || t.signature}</Text>
              <Text style={styles.sigRole}>{metadata.signaturePosition || ''}</Text>
            </View>
          </View>

          {invoice.notes && (
            <View style={styles.notesBox}>
              <Text style={{ fontWeight: 'bold' }}>{t.notes}:</Text>
              <Text>{invoice.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.watermark} fixed>
          <Text style={styles.watermarkText}>{t.watermark}</Text>
          <Link src="https://tagihin-invoice.vercel.app/">
            <Image src={typeof window !== 'undefined' ? window.location.origin + "/logo.png" : "https://tagihin-invoice.vercel.app/logo.png"} style={styles.watermarkLogo} />
          </Link>
        </View>
      </Page>
    </Document>
  );
};
