export const formatCurrency = (amount: number, currencyCode: string = 'IDR') => {
  let locale = 'en-US'; 
  
  if (currencyCode === 'IDR') locale = 'id-ID';
  if (currencyCode === 'EUR') locale = 'de-DE'; 
  if (currencyCode === 'GBP') locale = 'en-GB';
  if (currencyCode === 'SGD') locale = 'en-SG';
  if (currencyCode === 'MYR') locale = 'ms-MY';
  if (currencyCode === 'AUD') locale = 'en-AU';
  if (currencyCode === 'JPY') locale = 'ja-JP';
  if (currencyCode === 'CNY') locale = 'zh-CN';
  if (currencyCode === 'INR') locale = 'en-IN';
  if (currencyCode === 'THB') locale = 'th-TH';
  if (currencyCode === 'VND') locale = 'vi-VN';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount || 0);
};
