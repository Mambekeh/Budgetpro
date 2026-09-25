import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  query
} from "firebase/firestore";
import { getAuth, deleteUser } from "firebase/auth";
import { getUserPlan, canUseBusiness } from "../../utils/subscription";
import "./Settings.css";

export default function Settings() {
  const { currentUser, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [saveMessage, setSaveMessage] = useState('');
  const [mobileView, setMobileView] = useState(window.innerWidth < 768);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Profile state - EMPTY by default
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    country: 'South Africa',
    phone: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    currency: 'ZAR',
    language: 'en',
    theme: 'light',
    dateFormat: 'DD/MM/YYYY'
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    email: false,
    push: false,
    monthly: false,
    budgetAlerts: false,
    recurring: false
  });

  // Plan info - FIXED: Check localStorage directly
  const [userPlan, setUserPlan] = useState('free');
  const [isProUser, setIsProUser] = useState(false);

  // All countries with their default currencies
  const allCountries = [
    { name: 'Afghanistan', code: 'AF', phone: '+93', currency: 'AFN' },
    { name: 'Albania', code: 'AL', phone: '+355', currency: 'ALL' },
    { name: 'Algeria', code: 'DZ', phone: '+213', currency: 'DZD' },
    { name: 'Andorra', code: 'AD', phone: '+376', currency: 'EUR' },
    { name: 'Angola', code: 'AO', phone: '+244', currency: 'AOA' },
    { name: 'Antigua and Barbuda', code: 'AG', phone: '+1-268', currency: 'XCD' },
    { name: 'Argentina', code: 'AR', phone: '+54', currency: 'ARS' },
    { name: 'Armenia', code: 'AM', phone: '+374', currency: 'AMD' },
    { name: 'Australia', code: 'AU', phone: '+61', currency: 'AUD' },
    { name: 'Austria', code: 'AT', phone: '+43', currency: 'EUR' },
    { name: 'Azerbaijan', code: 'AZ', phone: '+994', currency: 'AZN' },
    { name: 'Bahamas', code: 'BS', phone: '+1-242', currency: 'BSD' },
    { name: 'Bahrain', code: 'BH', phone: '+973', currency: 'BHD' },
    { name: 'Bangladesh', code: 'BD', phone: '+880', currency: 'BDT' },
    { name: 'Barbados', code: 'BB', phone: '+1-246', currency: 'BBD' },
    { name: 'Belarus', code: 'BY', phone: '+375', currency: 'BYN' },
    { name: 'Belgium', code: 'BE', phone: '+32', currency: 'EUR' },
    { name: 'Belize', code: 'BZ', phone: '+501', currency: 'BZD' },
    { name: 'Benin', code: 'BJ', phone: '+229', currency: 'XOF' },
    { name: 'Bhutan', code: 'BT', phone: '+975', currency: 'BTN' },
    { name: 'Bolivia', code: 'BO', phone: '+591', currency: 'BOB' },
    { name: 'Bosnia and Herzegovina', code: 'BA', phone: '+387', currency: 'BAM' },
    { name: 'Botswana', code: 'BW', phone: '+267', currency: 'BWP' },
    { name: 'Brazil', code: 'BR', phone: '+55', currency: 'BRL' },
    { name: 'Brunei', code: 'BN', phone: '+673', currency: 'BND' },
    { name: 'Bulgaria', code: 'BG', phone: '+359', currency: 'BGN' },
    { name: 'Burkina Faso', code: 'BF', phone: '+226', currency: 'XOF' },
    { name: 'Burundi', code: 'BI', phone: '+257', currency: 'BIF' },
    { name: 'Cabo Verde', code: 'CV', phone: '+238', currency: 'CVE' },
    { name: 'Cambodia', code: 'KH', phone: '+855', currency: 'KHR' },
    { name: 'Cameroon', code: 'CM', phone: '+237', currency: 'XAF' },
    { name: 'Canada', code: 'CA', phone: '+1', currency: 'CAD' },
    { name: 'Central African Republic', code: 'CF', phone: '+236', currency: 'XAF' },
    { name: 'Chad', code: 'TD', phone: '+235', currency: 'XAF' },
    { name: 'Chile', code: 'CL', phone: '+56', currency: 'CLP' },
    { name: 'China', code: 'CN', phone: '+86', currency: 'CNY' },
    { name: 'Colombia', code: 'CO', phone: '+57', currency: 'COP' },
    { name: 'Comoros', code: 'KM', phone: '+269', currency: 'KMF' },
    { name: 'Congo', code: 'CG', phone: '+242', currency: 'XAF' },
    { name: 'Costa Rica', code: 'CR', phone: '+506', currency: 'CRC' },
    { name: 'Croatia', code: 'HR', phone: '+385', currency: 'HRK' },
    { name: 'Cuba', code: 'CU', phone: '+53', currency: 'CUP' },
    { name: 'Cyprus', code: 'CY', phone: '+357', currency: 'EUR' },
    { name: 'Czech Republic', code: 'CZ', phone: '+420', currency: 'CZK' },
    { name: 'Democratic Republic of the Congo', code: 'CD', phone: '+243', currency: 'CDF' },
    { name: 'Denmark', code: 'DK', phone: '+45', currency: 'DKK' },
    { name: 'Djibouti', code: 'DJ', phone: '+253', currency: 'DJF' },
    { name: 'Dominica', code: 'DM', phone: '+1-767', currency: 'XCD' },
    { name: 'Dominican Republic', code: 'DO', phone: '+1-809, +1-829, +1-849', currency: 'DOP' },
    { name: 'Ecuador', code: 'EC', phone: '+593', currency: 'USD' },
    { name: 'Egypt', code: 'EG', phone: '+20', currency: 'EGP' },
    { name: 'El Salvador', code: 'SV', phone: '+503', currency: 'USD' },
    { name: 'Equatorial Guinea', code: 'GQ', phone: '+240', currency: 'XAF' },
    { name: 'Eritrea', code: 'ER', phone: '+291', currency: 'ERN' },
    { name: 'Estonia', code: 'EE', phone: '+372', currency: 'EUR' },
    { name: 'Eswatini', code: 'SZ', phone: '+268', currency: 'SZL' },
    { name: 'Ethiopia', code: 'ET', phone: '+251', currency: 'ETB' },
    { name: 'Fiji', code: 'FJ', phone: '+679', currency: 'FJD' },
    { name: 'Finland', code: 'FI', phone: '+358', currency: 'EUR' },
    { name: 'France', code: 'FR', phone: '+33', currency: 'EUR' },
    { name: 'Gabon', code: 'GA', phone: '+241', currency: 'XAF' },
    { name: 'Gambia', code: 'GM', phone: '+220', currency: 'GMD' },
    { name: 'Georgia', code: 'GE', phone: '+995', currency: 'GEL' },
    { name: 'Germany', code: 'DE', phone: '+49', currency: 'EUR' },
    { name: 'Ghana', code: 'GH', phone: '+233', currency: 'GHS' },
    { name: 'Greece', code: 'GR', phone: '+30', currency: 'EUR' },
    { name: 'Grenada', code: 'GD', phone: '+1-473', currency: 'XCD' },
    { name: 'Guatemala', code: 'GT', phone: '+502', currency: 'GTQ' },
    { name: 'Guinea', code: 'GN', phone: '+224', currency: 'GNF' },
    { name: 'Guinea-Bissau', code: 'GW', phone: '+245', currency: 'XOF' },
    { name: 'Guyana', code: 'GY', phone: '+592', currency: 'GYD' },
    { name: 'Haiti', code: 'HT', phone: '+509', currency: 'HTG' },
    { name: 'Honduras', code: 'HN', phone: '+504', currency: 'HNL' },
    { name: 'Hungary', code: 'HU', phone: '+36', currency: 'HUF' },
    { name: 'Iceland', code: 'IS', phone: '+354', currency: 'ISK' },
    { name: 'India', code: 'IN', phone: '+91', currency: 'INR' },
    { name: 'Indonesia', code: 'ID', phone: '+62', currency: 'IDR' },
    { name: 'Iran', code: 'IR', phone: '+98', currency: 'IRR' },
    { name: 'Iraq', code: 'IQ', phone: '+964', currency: 'IQD' },
    { name: 'Ireland', code: 'IE', phone: '+353', currency: 'EUR' },
    { name: 'Israel', code: 'IL', phone: '+972', currency: 'ILS' },
    { name: 'Italy', code: 'IT', phone: '+39', currency: 'EUR' },
    { name: 'Jamaica', code: 'JM', phone: '+1-876', currency: 'JMD' },
    { name: 'Japan', code: 'JP', phone: '+81', currency: 'JPY' },
    { name: 'Jordan', code: 'JO', phone: '+962', currency: 'JOD' },
    { name: 'Kazakhstan', code: 'KZ', phone: '+7', currency: 'KZT' },
    { name: 'Kenya', code: 'KE', phone: '+254', currency: 'KES' },
    { name: 'Kiribati', code: 'KI', phone: '+686', currency: 'AUD' },
    { name: 'Kuwait', code: 'KW', phone: '+965', currency: 'KWD' },
    { name: 'Kyrgyzstan', code: 'KG', phone: '+996', currency: 'KGS' },
    { name: 'Laos', code: 'LA', phone: '+856', currency: 'LAK' },
    { name: 'Latvia', code: 'LV', phone: '+371', currency: 'EUR' },
    { name: 'Lebanon', code: 'LB', phone: '+961', currency: 'LBP' },
    { name: 'Lesotho', code: 'LS', phone: '+266', currency: 'LSL' },
    { name: 'Liberia', code: 'LR', phone: '+231', currency: 'LRD' },
    { name: 'Libya', code: 'LY', phone: '+218', currency: 'LYD' },
    { name: 'Liechtenstein', code: 'LI', phone: '+423', currency: 'CHF' },
    { name: 'Lithuania', code: 'LT', phone: '+370', currency: 'EUR' },
    { name: 'Luxembourg', code: 'LU', phone: '+352', currency: 'EUR' },
    { name: 'Madagascar', code: 'MG', phone: '+261', currency: 'MGA' },
    { name: 'Malawi', code: 'MW', phone: '+265', currency: 'MWK' },
    { name: 'Malaysia', code: 'MY', phone: '+60', currency: 'MYR' },
    { name: 'Maldives', code: 'MV', phone: '+960', currency: 'MVR' },
    { name: 'Mali', code: 'ML', phone: '+223', currency: 'XOF' },
    { name: 'Malta', code: 'MT', phone: '+356', currency: 'EUR' },
    { name: 'Marshall Islands', code: 'MH', phone: '+692', currency: 'USD' },
    { name: 'Mauritania', code: 'MR', phone: '+222', currency: 'MRU' },
    { name: 'Mauritius', code: 'MU', phone: '+230', currency: 'MUR' },
    { name: 'Mexico', code: 'MX', phone: '+52', currency: 'MXN' },
    { name: 'Micronesia', code: 'FM', phone: '+691', currency: 'USD' },
    { name: 'Moldova', code: 'MD', phone: '+373', currency: 'MDL' },
    { name: 'Monaco', code: 'MC', phone: '+377', currency: 'EUR' },
    { name: 'Mongolia', code: 'MN', phone: '+976', currency: 'MNT' },
    { name: 'Montenegro', code: 'ME', phone: '+382', currency: 'EUR' },
    { name: 'Morocco', code: 'MA', phone: '+212', currency: 'MAD' },
    { name: 'Mozambique', code: 'MZ', phone: '+258', currency: 'MZN' },
    { name: 'Myanmar', code: 'MM', phone: '+95', currency: 'MMK' },
    { name: 'Namibia', code: 'NA', phone: '+264', currency: 'NAD' },
    { name: 'Nauru', code: 'NR', phone: '+674', currency: 'AUD' },
    { name: 'Nepal', code: 'NP', phone: '+977', currency: 'NPR' },
    { name: 'Netherlands', code: 'NL', phone: '+31', currency: 'EUR' },
    { name: 'New Zealand', code: 'NZ', phone: '+64', currency: 'NZD' },
    { name: 'Nicaragua', code: 'NI', phone: '+505', currency: 'NIO' },
    { name: 'Niger', code: 'NE', phone: '+227', currency: 'XOF' },
    { name: 'Nigeria', code: 'NG', phone: '+234', currency: 'NGN' },
    { name: 'North Korea', code: 'KP', phone: '+850', currency: 'KPW' },
    { name: 'North Macedonia', code: 'MK', phone: '+389', currency: 'MKD' },
    { name: 'Norway', code: 'NO', phone: '+47', currency: 'NOK' },
    { name: 'Oman', code: 'OM', phone: '+968', currency: 'OMR' },
    { name: 'Pakistan', code: 'PK', phone: '+92', currency: 'PKR' },
    { name: 'Palau', code: 'PW', phone: '+680', currency: 'USD' },
    { name: 'Palestine', code: 'PS', phone: '+970', currency: 'ILS' },
    { name: 'Panama', code: 'PA', phone: '+507', currency: 'PAB' },
    { name: 'Papua New Guinea', code: 'PG', phone: '+675', currency: 'PGK' },
    { name: 'Paraguay', code: 'PY', phone: '+595', currency: 'PYG' },
    { name: 'Peru', code: 'PE', phone: '+51', currency: 'PEN' },
    { name: 'Philippines', code: 'PH', phone: '+63', currency: 'PHP' },
    { name: 'Poland', code: 'PL', phone: '+48', currency: 'PLN' },
    { name: 'Portugal', code: 'PT', phone: '+351', currency: 'EUR' },
    { name: 'Qatar', code: 'QA', phone: '+974', currency: 'QAR' },
    { name: 'Romania', code: 'RO', phone: '+40', currency: 'RON' },
    { name: 'Russia', code: 'RU', phone: '+7', currency: 'RUB' },
    { name: 'Rwanda', code: 'RW', phone: '+250', currency: 'RWF' },
    { name: 'Saint Kitts and Nevis', code: 'KN', phone: '+1-869', currency: 'XCD' },
    { name: 'Saint Lucia', code: 'LC', phone: '+1-758', currency: 'XCD' },
    { name: 'Saint Vincent and the Grenadines', code: 'VC', phone: '+1-784', currency: 'XCD' },
    { name: 'Samoa', code: 'WS', phone: '+685', currency: 'WST' },
    { name: 'San Marino', code: 'SM', phone: '+378', currency: 'EUR' },
    { name: 'Sao Tome and Principe', code: 'ST', phone: '+239', currency: 'STN' },
    { name: 'Saudi Arabia', code: 'SA', phone: '+966', currency: 'SAR' },
    { name: 'Senegal', code: 'SN', phone: '+221', currency: 'XOF' },
    { name: 'Serbia', code: 'RS', phone: '+381', currency: 'RSD' },
    { name: 'Seychelles', code: 'SC', phone: '+248', currency: 'SCR' },
    { name: 'Sierra Leone', code: 'SL', phone: '+232', currency: 'SLE' },
    { name: 'Singapore', code: 'SG', phone: '+65', currency: 'SGD' },
    { name: 'Slovakia', code: 'SK', phone: '+421', currency: 'EUR' },
    { name: 'Slovenia', code: 'SI', phone: '+386', currency: 'EUR' },
    { name: 'Solomon Islands', code: 'SB', phone: '+677', currency: 'SBD' },
    { name: 'Somalia', code: 'SO', phone: '+252', currency: 'SOS' },
    { name: 'South Africa', code: 'ZA', phone: '+27', currency: 'ZAR' },
    { name: 'South Korea', code: 'KR', phone: '+82', currency: 'KRW' },
    { name: 'South Sudan', code: 'SS', phone: '+211', currency: 'SSP' },
    { name: 'Spain', code: 'ES', phone: '+34', currency: 'EUR' },
    { name: 'Sri Lanka', code: 'LK', phone: '+94', currency: 'LKR' },
    { name: 'Sudan', code: 'SD', phone: '+249', currency: 'SDG' },
    { name: 'Suriname', code: 'SR', phone: '+597', currency: 'SRD' },
    { name: 'Sweden', code: 'SE', phone: '+46', currency: 'SEK' },
    { name: 'Switzerland', code: 'CH', phone: '+41', currency: 'CHF' },
    { name: 'Syria', code: 'SY', phone: '+963', currency: 'SYP' },
    { name: 'Taiwan', code: 'TW', phone: '+886', currency: 'TWD' },
    { name: 'Tajikistan', code: 'TJ', phone: '+992', currency: 'TJS' },
    { name: 'Tanzania', code: 'TZ', phone: '+255', currency: 'TZS' },
    { name: 'Thailand', code: 'TH', phone: '+66', currency: 'THB' },
    { name: 'Timor-Leste', code: 'TL', phone: '+670', currency: 'USD' },
    { name: 'Togo', code: 'TG', phone: '+228', currency: 'XOF' },
    { name: 'Tonga', code: 'TO', phone: '+676', currency: 'TOP' },
    { name: 'Trinidad and Tobago', code: 'TT', phone: '+1-868', currency: 'TTD' },
    { name: 'Tunisia', code: 'TN', phone: '+216', currency: 'TND' },
    { name: 'Turkey', code: 'TR', phone: '+90', currency: 'TRY' },
    { name: 'Turkmenistan', code: 'TM', phone: '+993', currency: 'TMT' },
    { name: 'Tuvalu', code: 'TV', phone: '+688', currency: 'AUD' },
    { name: 'Uganda', code: 'UG', phone: '+256', currency: 'UGX' },
    { name: 'Ukraine', code: 'UA', phone: '+380', currency: 'UAH' },
    { name: 'United Arab Emirates', code: 'AE', phone: '+971', currency: 'AED' },
    { name: 'United Kingdom', code: 'GB', phone: '+44', currency: 'GBP' },
    { name: 'United States', code: 'US', phone: '+1', currency: 'USD' },
    { name: 'Uruguay', code: 'UY', phone: '+598', currency: 'UYU' },
    { name: 'Uzbekistan', code: 'UZ', phone: '+998', currency: 'UZS' },
    { name: 'Vanuatu', code: 'VU', phone: '+678', currency: 'VUV' },
    { name: 'Vatican City', code: 'VA', phone: '+379', currency: 'EUR' },
    { name: 'Venezuela', code: 'VE', phone: '+58', currency: 'VES' },
    { name: 'Vietnam', code: 'VN', phone: '+84', currency: 'VND' },
    { name: 'Yemen', code: 'YE', phone: '+967', currency: 'YER' },
    { name: 'Zambia', code: 'ZM', phone: '+260', currency: 'ZMW' },
    { name: 'Zimbabwe', code: 'ZW', phone: '+263', currency: 'ZWL' }
  ];

  // Country phone codes mapping
  const countryPhoneCodes = allCountries.reduce((acc, country) => {
    acc[country.name] = country.phone;
    return acc;
  }, {});

  // Country currency mapping
  const countryCurrencyMapping = allCountries.reduce((acc, country) => {
    acc[country.name] = country.currency;
    return acc;
  }, {});

  // Currency symbols mapping
  const currencySymbols = {
    'ZAR': 'R',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NGN': '₦',
    'KES': 'KSh',
    'GHS': 'GH₵',
    'INR': '₹',
    'JPY': '¥',
    'CNY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'RUB': '₽',
    'TRY': '₺',
    'BRL': 'R$',
    'MXN': 'Mex$',
    'CLP': '$',
    'COP': '$',
    'PEN': 'S/',
    'ARS': '$',
    'UYU': '$U',
    'PYG': '₲',
    'BOB': 'Bs.',
    'CRC': '₡',
    'DOP': 'RD$',
    'GTQ': 'Q',
    'HNL': 'L',
    'NIO': 'C$',
    'PAB': 'B/.',
    'SVC': '₡',
    'TTD': 'TT$',
    'XCD': '$',
    'AWG': 'ƒ',
    'BBD': '$',
    'BMD': '$',
    'BZD': '$',
    'CUC': '$',
    'CUP': '$',
    'BSD': '$',
    'KYD': '$',
    'SBD': '$',
    'SRD': '$',
    // Add more as needed
  };

  // Currency options - common currencies + user's country currency
  const getCurrencyOptions = () => {
    const userCountryCurrency = countryCurrencyMapping[profile.country] || 'ZAR';
    const commonCurrencies = [
      { value: 'ZAR', label: 'South African Rand (R)' },
      { value: 'USD', label: 'US Dollar ($)' },
      { value: 'EUR', label: 'Euro (€)' },
      { value: 'GBP', label: 'British Pound (£)' },
      { value: 'CAD', label: 'Canadian Dollar (C$)' },
      { value: 'AUD', label: 'Australian Dollar (A$)' },
      { value: 'INR', label: 'Indian Rupee (₹)' },
      { value: 'JPY', label: 'Japanese Yen (¥)' },
      { value: 'CNY', label: 'Chinese Yuan (¥)' },
      { value: 'KES', label: 'Kenyan Shilling (KSh)' },
      { value: 'NGN', label: 'Nigerian Naira (₦)' },
      { value: 'GHS', label: 'Ghanaian Cedi (GH₵)' },
      { value: 'BRL', label: 'Brazilian Real (R$)' },
      { value: 'MXN', label: 'Mexican Peso (Mex$)' }
    ];

    // Add user's country currency if not already in list
    if (!commonCurrencies.find(c => c.value === userCountryCurrency)) {
      const countryName = allCountries.find(c => c.currency === userCountryCurrency)?.name || profile.country;
      commonCurrencies.unshift({
        value: userCountryCurrency,
        label: `${countryName} Currency (${currencySymbols[userCountryCurrency] || userCountryCurrency})`
      });
    }

    return commonCurrencies;
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.uid) return;

      try {
        // FIXED: Check plan directly from localStorage
        const plan = localStorage.getItem('budgetPro_plan') || 'free';
        setUserPlan(plan);
        // FIXED: Pro user includes essential, pro, and lifetime
        setIsProUser(plan === 'essential' || plan === 'pro' || plan === 'lifetime');

        // Load profile data
        await loadProfileData();

        // Load preferences
        loadPreferences();

        // Load notifications if pro user
        if (plan === 'essential' || plan === 'pro' || plan === 'lifetime') {
          loadNotifications();
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [currentUser]);

  // Load profile data from Firestore - PRIORITIZE ROOT DOCUMENT
  const loadProfileData = async () => {
    try {
      // ✅ FIRST: Try Firestore ROOT user document (users/{uid})
      if (currentUser?.uid) {
        const rootUserRef = doc(db, 'users', currentUser.uid);
        const rootUserSnap = await getDoc(rootUserRef);
        
        if (rootUserSnap.exists()) {
          const rootData = rootUserSnap.data();
          console.log("✅ Settings: Loaded from root document:", rootData);
          
          setProfile({
            name: rootData.name || rootData.signupName || '',
            email: rootData.email || currentUser?.email || '',
            country: rootData.displayCountry || rootData.signupCountry || 'South Africa',
            phone: rootData.phone || ''
          });
          
          // Update currency based on root document
          const rootCurrency = rootData.displayCurrency || 'ZAR';
          localStorage.setItem('bp_currency', rootCurrency);
          setPreferences(prev => ({ ...prev, currency: rootCurrency }));
          return;
        }
      }

      // ✅ SECOND: Try Firestore profile subcollection (backward compatibility)
      if (currentUser?.uid) {
        const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'info');
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const firestoreData = profileSnap.data();
          console.log("✅ Settings: Loaded from profile subcollection:", firestoreData);
          
          setProfile({
            name: firestoreData.name || '',
            email: firestoreData.email || currentUser?.email || '',
            country: firestoreData.country || 'South Africa',
            phone: firestoreData.phone || ''
          });
          
          // Update currency based on country if not set
          const countryCurrency = countryCurrencyMapping[firestoreData.country] || 'ZAR';
          const savedCurrency = localStorage.getItem('bp_currency');
          if (!savedCurrency || savedCurrency === 'ZAR') {
            localStorage.setItem('bp_currency', countryCurrency);
            setPreferences(prev => ({ ...prev, currency: countryCurrency }));
          }
          return;
        }
      }

      // ✅ THIRD: Fallback to localStorage and currentUser
      const localStorageProfile = {
        name: localStorage.getItem('bp_profile_name') || '',
        email: localStorage.getItem('bp_profile_email') || currentUser?.email || '',
        country: localStorage.getItem('bp_profile_country') || 'South Africa',
        phone: localStorage.getItem('bp_profile_phone') || ''
      };
      
      setProfile(localStorageProfile);
      
      // Update currency based on country
      const countryCurrency = countryCurrencyMapping[localStorageProfile.country] || 'ZAR';
      const savedCurrency = localStorage.getItem('bp_currency');
      if (!savedCurrency || savedCurrency === 'ZAR') {
        localStorage.setItem('bp_currency', countryCurrency);
        setPreferences(prev => ({ ...prev, currency: countryCurrency }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Load preferences from localStorage
  const loadPreferences = () => {
    const defaultPreferences = {
      currency: 'ZAR',
      language: 'en',
      theme: 'light',
      dateFormat: 'DD/MM/YYYY'
    };

    const savedPrefs = {
      currency: localStorage.getItem('bp_currency') || defaultPreferences.currency,
      language: localStorage.getItem('bp_language') || defaultPreferences.language,
      theme: localStorage.getItem('bp_theme') || defaultPreferences.theme,
      dateFormat: localStorage.getItem('bp_date_format') || defaultPreferences.dateFormat
    };

    setPreferences(savedPrefs);
    applyTheme(savedPrefs.theme);
  };

  // Load notifications from localStorage
  const loadNotifications = () => {
    if (!isProUser) return;
    
    setNotifications({
      email: localStorage.getItem('bp_notifications_email') === 'true',
      push: localStorage.getItem('bp_notifications_push') === 'true',
      monthly: localStorage.getItem('bp_notifications_monthly') === 'true',
      budgetAlerts: localStorage.getItem('bp_notifications_budget_alerts') === 'true',
      recurring: localStorage.getItem('bp_notifications_recurring') === 'true'
    });
  };

  // Apply theme to document
  const applyTheme = (theme) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.style.setProperty('--background-color', '#1a202c');
      root.style.setProperty('--text-color', '#e2e8f0');
      document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
      root.classList.remove('dark-theme');
      root.style.setProperty('--background-color', '#f8fafc');
      root.style.setProperty('--text-color', '#2c3e50');
      document.body.classList.remove('dark-theme');
    } else {
      // System - check user preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
      } else {
        root.classList.remove('dark-theme');
        document.body.classList.remove('dark-theme');
      }
    }
  };

  // Handle profile change
  const handleProfileChange = (field, value) => {
    const updatedProfile = { ...profile, [field]: value };
    
    // Auto-set phone code when country changes
    if (field === 'country' && value !== profile.country) {
      const phoneCode = countryPhoneCodes[value];
      if (phoneCode && (!profile.phone || profile.phone.startsWith('+'))) {
        updatedProfile.phone = phoneCode;
      }
      
      // Auto-set currency based on country
      const countryCurrency = countryCurrencyMapping[value];
      if (countryCurrency) {
        const updatedPreferences = { ...preferences, currency: countryCurrency };
        setPreferences(updatedPreferences);
        
        // Save to localStorage immediately
        localStorage.setItem('bp_currency', countryCurrency);
        // SAVE COUNTRY TO localStorage FOR UPGRADE PAGE
        localStorage.setItem('bp_country', value);
        
        // Dispatch event to notify other components about currency change
        window.dispatchEvent(new CustomEvent('currencyChanged', { 
          detail: { currency: countryCurrency, country: value }
        }));
        
        // NEW: Dispatch separate event for country change (for Upgrade page)
        window.dispatchEvent(new CustomEvent('countryChanged', { 
          detail: { country: value, currency: countryCurrency }
        }));
      }
    }
    
    setProfile(updatedProfile);
  };

  // Handle preferences change
  const handlePreferenceChange = (field, value) => {
    const updatedPreferences = { ...preferences, [field]: value };
    setPreferences(updatedPreferences);
    
    // Apply theme immediately
    if (field === 'theme') {
      applyTheme(value);
    }
    
    // If currency changed, notify other components
    if (field === 'currency') {
      localStorage.setItem('bp_currency', value);
      window.dispatchEvent(new CustomEvent('currencyChanged', { 
        detail: { currency: value, country: profile.country }
      }));
    }
  };

  // Handle notification change
  const handleNotificationChange = (field, value) => {
    if (!isProUser) {
      alert('Upgrade to Professional to use notifications.');
      navigate('/upgrade');
      return;
    }
    
    setNotifications({ ...notifications, [field]: value });
  };

  // ✅ CRITICAL FIX: Save profile - SYNC TO BOTH ROOT DOCUMENT AND SUBCOLLECTION
  const saveProfile = async () => {
    if (!currentUser?.uid) return;
    
    try {
      // 1️⃣ Save to Firestore subcollection (existing logic)
      const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'info');
      await setDoc(profileRef, {
        name: profile.name,
        email: profile.email,
        country: profile.country,
        phone: profile.phone,
        updatedAt: new Date().toISOString()
      });

      // 2️⃣ ✅ CRITICAL FIX: Sync to root user document via AuthContext
      const countryCurrency = countryCurrencyMapping[profile.country] || 'ZAR';
      
      await updateUserProfile({
        // Only update display fields, NOT signup fields
        displayCountry: profile.country,
        displayCurrency: countryCurrency,
        // Sync name so Dashboard greeting updates
        name: profile.name || ''
      });

      // 3️⃣ Save to localStorage (existing logic)
      localStorage.setItem('bp_profile_name', profile.name);
      localStorage.setItem('bp_profile_email', profile.email);
      localStorage.setItem('bp_profile_country', profile.country);
      localStorage.setItem('bp_profile_phone', profile.phone);
      localStorage.setItem('bp_country', profile.country);

      // Save currency based on country if not manually changed
      const currentCurrency = localStorage.getItem('bp_currency');
      if (countryCurrency && (!currentCurrency || currentCurrency === 'ZAR')) {
        localStorage.setItem('bp_currency', countryCurrency);
        setPreferences(prev => ({ ...prev, currency: countryCurrency }));
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('currencyChanged', { 
          detail: { currency: countryCurrency, country: profile.country }
        }));
        
        // Notify about country change
        window.dispatchEvent(new CustomEvent('countryChanged', { 
          detail: { country: profile.country, currency: countryCurrency }
        }));
      }

      setSaveMessage('✅ Profile saved & synced successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      
      console.log("✅ Settings: Profile synced to both root document and subcollection");
      console.log("✅ Root document updated with:", {
        displayCountry: profile.country,
        displayCurrency: countryCurrency,
        name: profile.name
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage('❌ Error saving profile: ' + error.message);
    }
  };

  // Save preferences
  const savePreferences = () => {
    try {
      localStorage.setItem('bp_currency', preferences.currency);
      localStorage.setItem('bp_language', preferences.language);
      localStorage.setItem('bp_theme', preferences.theme);
      localStorage.setItem('bp_date_format', preferences.dateFormat);

      applyTheme(preferences.theme);
      
      // Notify about currency change
      window.dispatchEvent(new CustomEvent('currencyChanged', { 
        detail: { currency: preferences.currency, country: profile.country }
      }));
      
      setSaveMessage('✅ Preferences saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage('❌ Error saving preferences');
    }
  };

  // Save notifications
  const saveNotifications = () => {
    if (!isProUser) {
      alert('Upgrade to Professional to use notifications.');
      navigate('/upgrade');
      return;
    }

    try {
      localStorage.setItem('bp_notifications_email', notifications.email);
      localStorage.setItem('bp_notifications_push', notifications.push);
      localStorage.setItem('bp_notifications_monthly', notifications.monthly);
      localStorage.setItem('bp_notifications_budget_alerts', notifications.budgetAlerts);
      localStorage.setItem('bp_notifications_recurring', notifications.recurring);

      setSaveMessage('✅ Notification preferences saved!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving notifications:', error);
      setSaveMessage('❌ Error saving notifications');
    }
  };

  // Export ALL data from Firestore
  const exportData = async () => {
    if (!currentUser?.uid) return;
    
    setExporting(true);
    
    try {
      // List of all collections to export
      const collections = [
        'income', 
        'expenses', 
        'debts',
        'lending',
        'business',
        'subscriptions',
        'budgets',
        'goals'
      ];

      const data = {
        exportDate: new Date().toISOString(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        profile: {},
        collections: {},
        preferences: {},
        localStorage: {}
      };

      // 1. Export Profile
      try {
        const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'info');
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          data.profile = profileSnap.data();
        }
      } catch (error) {
        console.log('No profile found');
      }

      // 2. Export all collections
      for (const collectionName of collections) {
        try {
          const collectionRef = collection(db, 'users', currentUser.uid, collectionName);
          const querySnapshot = await getDocs(collectionRef);
          data.collections[collectionName] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (error) {
          console.log(`Collection ${collectionName} not found or error:`, error);
          data.collections[collectionName] = [];
        }
      }

      // 3. Export preferences from localStorage
      const prefKeys = [
        'bp_currency',
        'bp_language', 
        'bp_theme',
        'bp_date_format',
        'budgetPro_plan',
        'bp_trial_entries'
      ];

      prefKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          data.preferences[key] = value;
        }
      });

      // 4. Export notifications if pro user
      if (isProUser) {
        const notificationKeys = [
          'bp_notifications_email',
          'bp_notifications_push',
          'bp_notifications_monthly',
          'bp_notifications_budget_alerts',
          'bp_notifications_recurring'
        ];

        notificationKeys.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            data.preferences[key] = value;
          }
        });
      }

      // 5. Export all localStorage data (excluding sensitive tokens)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && 
            !key.includes('firebase') && 
            !key.includes('token') && 
            !key.includes('auth') &&
            !key.includes('session')) {
          try {
            data.localStorage[key] = localStorage.getItem(key);
          } catch (e) {
            data.localStorage[key] = 'Error reading value';
          }
        }
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budgetpro-export-${currentUser.uid}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExporting(false);
        setSaveMessage('✅ Data exported successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      }, 100);

    } catch (error) {
      console.error('Error exporting data:', error);
      setExporting(false);
      setSaveMessage('❌ Error exporting data: ' + error.message);
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  // Delete account and all data
  const deleteAccount = async () => {
    if (!currentUser?.uid) return;
    
    const confirmed = window.confirm(
      'This will permanently delete your account and all your data. ' +
      'This action cannot be undone. Are you sure?'
    );
    
    if (!confirmed) return;

    setDeleting(true);

    try {
      // Delete all Firestore collections
      const collections = [
        'income', 
        'expenses', 
        'debts',
        'lending',
        'business',
        'subscriptions',
        'budgets',
        'goals',
        'profile'
      ];
      
      for (const collectionName of collections) {
        try {
          if (collectionName === 'profile') {
            // Delete profile document
            const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'info');
            await deleteDoc(profileRef);
          } else {
            // Delete collection documents
            const collectionRef = collection(db, 'users', currentUser.uid, collectionName);
            const querySnapshot = await getDocs(collectionRef);
            
            const deletePromises = querySnapshot.docs.map(docSnapshot => 
              deleteDoc(doc(db, 'users', currentUser.uid, collectionName, docSnapshot.id))
            );
            
            await Promise.all(deletePromises);
          }
        } catch (error) {
          console.log(`Error deleting ${collectionName}:`, error);
          // Continue with other collections
        }
      }

      // Delete user document if exists
      const userRef = doc(db, 'users', currentUser.uid);
      try {
        await deleteDoc(userRef);
      } catch (e) {
        // User document might not exist, that's okay
      }

      // Delete Firebase Auth user
      try {
        await deleteUser(auth.currentUser);
      } catch (error) {
        console.error('Error deleting auth user:', error);
        // Still clear local data
      }

      // Clear all localStorage data
      const localStorageKeys = [
        'budgetPro_plan',
        'bp_trial_entries',
        'bp_profile_name',
        'bp_profile_email',
        'bp_profile_country',
        'bp_profile_phone',
        'bp_currency',
        'bp_language',
        'bp_theme',
        'bp_date_format'
      ];

      // Clear notification keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bp_')) {
          localStorageKeys.push(key);
        }
      }

      // Remove duplicates and clear
      [...new Set(localStorageKeys)].forEach(key => localStorage.removeItem(key));

      // Navigate to login
      navigate('/login');
      
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleting(false);
      setSaveMessage('❌ Error deleting account. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy & Data', icon: '🔒' }
  ];

  // Theme options
  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' }
  ];

  // Date format options
  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
  ];

  // Notification options
  const notificationOptions = [
    { key: 'email', label: 'Email notifications', description: 'Receive important updates via email', icon: '📧' },
    { key: 'push', label: 'Push notifications', description: 'Get real-time alerts in your browser', icon: '🔔' },
    { key: 'monthly', label: 'Monthly reports', description: 'Automated monthly financial summaries', icon: '📊' },
    { key: 'budgetAlerts', label: 'Budget alerts', description: 'Notifications when you exceed budget limits', icon: '⚠️' },
    { key: 'recurring', label: 'Recurring reminders', description: 'Reminders for recurring expenses', icon: '🔄' }
  ];

  return (
    <div className={`settings-container ${mobileView ? 'mobile-view' : ''}`}>
      <div className={`settings-content ${mobileView ? 'mobile-padding' : 'desktop-padding'}`}>
        {/* Header */}
        <div className="settings-header">
          <h1 className={`settings-title ${mobileView ? 'mobile-title' : ''}`}>
            ⚙️ Settings
          </h1>
          <p className={`settings-subtitle ${mobileView ? 'mobile-subtitle' : ''}`}>
            Customize your BudgetPro experience
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('✅') ? 'success' : 'error'}`}>
            {saveMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div className={`tab-navigation ${mobileView ? 'mobile-tabs' : 'desktop-tabs'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'} ${mobileView ? 'mobile-tab-button' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {/* Mobile bullet indicator */}
              {mobileView && (
                <div className={`mobile-tab-indicator ${activeTab === tab.id ? 'active' : ''}`}></div>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className={`content-area ${mobileView ? 'mobile-content' : ''}`}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="tab-header">
                <span>👤</span> Profile Information
              </h2>
              
              <div className={`profile-grid ${mobileView ? 'mobile-grid' : ''}`}>
                <div>
                  <label className="input-label">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="profile-input"
                  />
                </div>

                <div>
                  <label className="input-label">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="profile-input"
                  />
                </div>

                <div>
                  <label className="input-label">
                    Country
                  </label>
                  <select
                    value={profile.country}
                    onChange={(e) => handleProfileChange('country', e.target.value)}
                    className="profile-select"
                  >
                    {allCountries.map(country => (
                      <option key={country.code} value={country.name}>
                        {country.name} ({country.currency})
                      </option>
                    ))}
                  </select>
                  <p className="input-help">
                    Currency will auto-set to {countryCurrencyMapping[profile.country] || 'ZAR'}
                  </p>
                </div>

                <div>
                  <label className="input-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    placeholder={countryPhoneCodes[profile.country] || "Phone number"}
                    className="profile-input"
                  />
                  <p className="input-help">
                    Country code automatically set based on your country
                  </p>
                </div>
              </div>

              <button
                onClick={saveProfile}
                className="save-button"
              >
                💾 Save Profile
              </button>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div>
              <h2 className="tab-header">
                <span>⚙️</span> App Preferences
              </h2>
              
              <div className={`preferences-grid ${mobileView ? 'mobile-grid' : ''}`}>
                <div>
                  <label className="input-label">
                    Currency
                  </label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                    className="preference-select"
                  >
                    {getCurrencyOptions().map(currency => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                  <p className="input-help">
                    Selected: {preferences.currency} ({currencySymbols[preferences.currency] || preferences.currency})
                  </p>
                </div>

                <div>
                  <label className="input-label">
                    Language
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="preference-select"
                  >
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="theme-label">
                    Theme
                  </label>
                  <div className="theme-options">
                    {themeOptions.map(theme => (
                      <label key={theme.value} className={`theme-option ${preferences.theme === theme.value ? 'theme-selected' : ''}`}>
                        <input
                          type="radio"
                          name="theme"
                          value={theme.value}
                          checked={preferences.theme === theme.value}
                          onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                          className="theme-radio"
                        />
                        <span className="theme-label-text">{theme.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="input-label">
                    Date Format
                  </label>
                  <select
                    value={preferences.dateFormat}
                    onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                    className="preference-select"
                  >
                    {dateFormatOptions.map(format => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={savePreferences}
                className="save-button"
              >
                💾 Save Preferences
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="tab-header">
                <span>🔔</span> Notification Settings
              </h2>
              
              {!isProUser ? (
                <div className="pro-upgrade-card">
                  <div className="upgrade-icon">
                    🔒
                  </div>
                  <h3 className="upgrade-title">
                    Notifications (Pro Only)
                  </h3>
                  <p className="upgrade-description">
                    Upgrade to Professional to unlock email alerts, budget alerts, and automated reminders.
                  </p>
                  <button
                    onClick={() => navigate('/upgrade')}
                    className="upgrade-button"
                  >
                    🚀 Upgrade to Professional
                  </button>
                </div>
              ) : (
                <div className="pro-status-card">
                  <div className="pro-icon">
                    ⭐
                  </div>
                  <h3 className="pro-title">
                    Pro Notifications Enabled
                  </h3>
                  <p className="pro-description">
                    You have access to all notification features with your {userPlan.toUpperCase()} plan.
                  </p>
                </div>
              )}

              <div className="notifications-list">
                {notificationOptions.map((item) => (
                  <div key={item.key} className={`notification-item ${!isProUser ? 'disabled' : ''}`}>
                    <div className="notification-info">
                      <span className="notification-icon">
                        {item.icon}
                      </span>
                      <div>
                        <div className={`notification-label ${!isProUser ? 'disabled-text' : ''}`}>
                          {item.label}
                        </div>
                        <div className={`notification-description ${!isProUser ? 'disabled-description' : ''}`}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={isProUser && notifications[item.key]}
                        onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                        disabled={!isProUser}
                        className="toggle-input"
                      />
                      <div className={`toggle-slider ${isProUser && notifications[item.key] ? 'on' : 'off'} ${!isProUser ? 'disabled-toggle' : ''}`}>
                        <div className="toggle-knob"></div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {isProUser && (
                <button
                  onClick={saveNotifications}
                  className="notifications-save-button"
                  disabled={!isProUser}
                >
                  💾 Save Notification Preferences
                </button>
              )}
            </div>
          )}

          {/* Privacy & Data Tab */}
          {activeTab === 'privacy' && (
            <div>
              <h2 className="tab-header">
                <span>🔒</span> Privacy & Data
              </h2>
              
              <div className="privacy-sections">
                {/* Export Data */}
                <div className="export-section">
                  <h3 className="section-header">
                    <span>📥</span> Export My Data
                  </h3>
                  <p className="section-description">
                    Download a complete copy of all your data including profile, preferences, income, expenses, debts, subscriptions, and more.
                  </p>
                  <button
                    onClick={exportData}
                    className="export-button"
                    disabled={exporting}
                  >
                    {exporting ? (
                      <>
                        <span className="button-spinner"></span>
                        Exporting...
                      </>
                    ) : (
                      '📥 Export My Data'
                    )}
                  </button>
                  {exporting && (
                    <p className="export-note">
                      This may take a moment depending on the amount of data...
                    </p>
                  )}
                </div>

                {/* Delete Account */}
                <div className="delete-section">
                  <h3 className="danger-header">
                    <span>🚨</span> Danger Zone
                  </h3>
                  <p className="section-description">
                    Permanently delete your account and all your data. This action cannot be undone.
                  </p>
                  <button
                    onClick={deleteAccount}
                    className="delete-button"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <span className="button-spinner"></span>
                        Deleting...
                      </>
                    ) : (
                      '🗑️ Delete Account & All Data'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="footer-links-container">
          <div className="footer-links">
            <button 
              onClick={() => window.location.href = 'mailto:support@budgetpro.com'}
              className="footer-link"
            >
              📧 Contact Support
            </button>
            <button 
              onClick={() => navigate('/terms')}
              className="footer-link"
            >
              📄 Terms & Conditions
            </button>
            <button 
              onClick={() => navigate('/privacy')}
              className="footer-link"
            >
              🔒 Privacy Policy
            </button>
          </div>
        </div>
      </div>

      {/* CSS for dark mode */}
      <style jsx>{`
        :root {
          --background-color: #f8fafc;
          --text-color: #2c3e50;
        }
        
        .dark-theme {
          --background-color: #1a202c;
          --text-color: #e2e8f0;
        }
        
        body {
          background-color: var(--background-color);
          color: var(--text-color);
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        
        .settings-container {
          background-color: var(--background-color);
          color: var(--text-color);
        }
        
        .content-area {
          background-color: var(--text-color) === '#2c3e50' ? white : #2d3748;
          color: var(--text-color);
          border: 1px solid var(--text-color) === '#2c3e50' ? #e9ecef : #4a5568;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .button-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }
        
        .pro-status-card {
          padding: 20px;
          background-color: #e6fffa;
          border-radius: 12px;
          border: 1px solid #81e6d9;
          margin-bottom: 24px;
          text-align: center;
        }
        
        .pro-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }
        
        .pro-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
        }
        
        .pro-description {
          color: #4a5568;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .export-note {
          font-size: 12px;
          color: #718096;
          margin-top: 8px;
          text-align: center;
          font-style: italic;
        }
        
        @media (max-width: 767px) {
          .settings-container {
            padding-top: 60px;
          }
          
          input, select, button {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}