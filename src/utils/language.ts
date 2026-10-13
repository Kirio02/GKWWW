import { AppLanguage } from '../types';

export const languageList: { code: AppLanguage; displayName: string; nativeName: string }[] = [
  { code: 'hinglish', displayName: 'Hinglish', nativeName: 'Hinglish (Default)' },
  { code: 'hi', displayName: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'gu', displayName: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'en', displayName: 'English', nativeName: 'English' },
];

export const Strings = {
  youGave: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return 'Aapne Diye (Udhaar)';
      case 'hi': return 'आपने दिए (उधार)';
      case 'gu': return 'તમે આપ્યા (ઉધાર)';
      default: return 'You Gave (Credit)';
    }
  },
  youGot: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return 'Aapko Mile (Jama)';
      case 'hi': return 'आपको मिले (जमा)';
      case 'gu': return 'તમને મળ્યા (જમા)';
      default: return 'You Got (Payment)';
    }
  },
  youllReceive: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return 'Aapko Milenge';
      case 'hi': return 'आपको मिलेंगे';
      case 'gu': return 'તમને મળશે';
      default: return "You'll Receive";
    }
  },
  youllPay: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return 'Aapko Dene Hain';
      case 'hi': return 'आपको देने हैं';
      case 'gu': return 'તમારે આપવાના';
      default: return "You'll Pay";
    }
  },
  addCustomer: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return '+ Customer Jodein';
      case 'hi': return '+ ग्राहक जोड़ें';
      case 'gu': return '+ ગ્રાહક ઉમેરો';
      default: return '+ Add Customer';
    }
  },
  tabKhata: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return 'Khata';
      case 'hi': return 'खाता';
      case 'gu': return 'ખાતાવહી';
      default: return 'Ledger';
    }
  },
  tabStock: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return 'Stock';
      case 'hi': return 'स्टॉक';
      case 'gu': return 'સ્ટોક';
      default: return 'Stock';
    }
  },
  tabBill: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return 'Bill / POS';
      case 'hi': return 'बिल / POS';
      case 'gu': return 'બિલ / POS';
      default: return 'Bill / POS';
    }
  },
  tabCashbook: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return 'Cashbook';
      case 'hi': return 'रोकड़ बही';
      case 'gu': return 'રોકડમેળ';
      default: return 'Cashbook';
    }
  },
  tabShop: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return 'Dukan';
      case 'hi': return 'दुकान';
      case 'gu': return 'દુકાન';
      default: return 'Shop';
    }
  },
  searchPlaceholder: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return 'Customer ka naam ya mobile search karein...';
      case 'hi': return 'ग्राहक का नाम या मोबाइल खोजें...';
      case 'gu': return 'ગ્રાહકનું નામ કે મોબાઈલ શોધો...';
      default: return 'Search customer name or mobile...';
    }
  },
  filterAll: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return 'Sabhi';
      case 'hi': return 'सभी';
      case 'gu': return 'બધા';
      default: return 'All';
    }
  },
  settled: (lang: AppLanguage): string => {
    switch (lang) {
      case 'hinglish': return 'Chukta';
      case 'hi': return 'चुक्ता';
      case 'gu': return 'ચૂકતે';
      default: return 'Settled';
    }
  },
};
