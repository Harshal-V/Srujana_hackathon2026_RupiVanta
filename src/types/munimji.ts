export type AppLanguage = 'en' | 'kn' | 'hi' | 'ta' | 'te' | 'ml';

export type PrimaryTab = 'home' | 'notices' | 'money' | 'help' | 'more';

export type MoreSubTab =
  | 'intelligence'
  | 'accuracy'
  | 'reports'
  | 'simulator'
  | 'receivables'
  | 'payables';

export type PersonRole = 'CA' | 'Accountant' | 'Lawyer' | 'Family' | 'Other';

export interface TrustedPerson {
  id: string;
  name: string;
  role: PersonRole;
  phone: string;
  note?: string;
}

/**
 * 4 Supplied showcase contacts for RupiVanta demo & showcase
 */
export const INITIAL_PEOPLE: TrustedPerson[] = [
  {
    id: 'person-ca-ramesh',
    name: 'CA Ramesh',
    role: 'CA',
    phone: '9109230036',
    note: 'GST & Income Tax filings, compliance reviews',
  },
  {
    id: 'person-suresh',
    name: 'Suresh',
    role: 'Accountant',
    phone: '8147246735',
    note: 'Daily shop bills & cash ledger entries',
  },
  {
    id: 'person-meera',
    name: 'Advocate Meera',
    role: 'Lawyer',
    phone: '9019824803',
    note: 'Cheque bounce defense & legal notice replies',
  },
  {
    id: 'person-priya',
    name: 'Priya Sharma',
    role: 'Family',
    phone: '9535577897',
    note: 'Family co-owner & emergency contact',
  },
];
