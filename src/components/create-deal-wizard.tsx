'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  FileText, 
  Trash2, 
  X,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROPERTY_TYPES, LOAN_PURPOSES, CITIES_BY_STATE, CITY_OTHER } from '@/config/deal-options';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUserCompanyId } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UploadedFile {
  file: File;
  preview?: string;
  type: string;
}

interface Investor {
  id: string;
  email: string;
  full_name: string;
  company_id: string;
  role: string;
  source?: 'user_profiles' | 'investors'; // Track which table this investor came from
}

interface SelectedInvestor {
  id: string;
  source: 'user_profiles' | 'investors';
}

interface DealFormData {
  // Step 1: Basic Info
  name: string;
  type: string;
  borrowerName: string;
  borrowerContact: string;
  propertyAddress: string;
  city: string;
  state: string;
  propertyType: string;
  status: string;
  loanPurpose: string;

  // Step 2: Investor Details
  selectedInvestors: SelectedInvestor[];
  investorNotes: string;

  // Step 3: Financial Terms
  targetAmount: string;
  raisedAmount: string;
  minimumInvestment: string;
  interestRate: string;
  termLengthMonths: string;
  fundingCloseDate: string;
  firstPayoutDate: string;

  // Step 4: Collateral
  collateralType: string;
  collateralAddress: string;
  estimatedPropertyValue: string;
  loanToValueRatio: string;
  assetNotes: string;

  // Step 5: Documents
  uploadedFiles: UploadedFile[];

  // Step 6: Communication
  defaultInvestorAudience: string;
  enableBroadcastChannel: boolean;
  enableInvestorInbox: boolean;
  requireInvestorAcknowledgment: boolean;
  automatedInvestorMessage: string;
  sendAutomatedMessage: boolean;

  // Step 7: Milestones
  closeDate: string;
  internalApprovalDeadline: string;
  nextMilestone: string;
  milestoneType: string;
  milestoneNotes: string;

  // Step 8: Review
  notes: string;
}

interface CreateDealWizardProps {
  onClose: () => void;
  onSave: (data: DealFormData) => Promise<void>;
  initialData?: any;
}

const STEPS = [
  { number: 1, label: 'Basic Info' },
  { number: 2, label: 'Investor Details' },
  { number: 3, label: 'Financial Terms' },
  { number: 4, label: 'Collateral' },
  { number: 5, label: 'Documents' },
  { number: 6, label: 'Communication' },
  { number: 7, label: 'Milestones' },
  { number: 8, label: 'Review' },
];

export function CreateDealWizard({ onClose, onSave, initialData }: CreateDealWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [investorsLoading, setInvestorsLoading] = useState(true);
  const [investorSearch, setInvestorSearch] = useState('');
  const [showInvestorDropdown, setShowInvestorDropdown] = useState(false);
  const [cityOther, setCityOther] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<DealFormData>({
    name: '',
    type: 'Bridge Loan',
    borrowerName: '',
    borrowerContact: '',
    propertyAddress: '',
    city: '',
    state: 'TX',
    propertyType: '',
    status: 'Funding',
    loanPurpose: '',

    selectedInvestors: [],
    investorNotes: '',

    targetAmount: '',
    raisedAmount: '',
    minimumInvestment: '',
    interestRate: '',
    termLengthMonths: '12',
    fundingCloseDate: '',
    firstPayoutDate: '',

    collateralType: '',
    collateralAddress: '',
    estimatedPropertyValue: '',
    loanToValueRatio: '',
    assetNotes: '',

    uploadedFiles: [],

    defaultInvestorAudience: '',
    enableBroadcastChannel: true,
    enableInvestorInbox: true,
    requireInvestorAcknowledgment: false,
    automatedInvestorMessage: '',
    sendAutomatedMessage: false,

    closeDate: '',
    internalApprovalDeadline: '',
    nextMilestone: '',
    milestoneType: 'normal',
    milestoneNotes: '',

    notes: '',
  });

  // Fetch investors on component mount
  React.useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) {
          setInvestorsLoading(false);
          return;
        }

        const allInvestors: Investor[] = [];

        // Fetch from investors table
        const { data: investorsData, error: investorsError } = await supabase
          .from('investors')
          .select('id, email, full_name, company_id')
          .eq('company_id', companyId);

        if (investorsError) {
          console.error('Error fetching from investors table:', investorsError);
        } else if (investorsData) {
          allInvestors.push(...investorsData.map((inv: any) => ({
            id: inv.id,
            email: inv.email,
            full_name: inv.full_name,
            company_id: inv.company_id,
            role: 'investor',
            source: 'investors' as const
          })));
        }

        // Fetch from user_profiles table with role = investor
        // Use user_id (auth ID) as the identifier — this is what the investor-side APIs use
        const { data: userProfilesData, error: userError } = await supabase
          .from('user_profiles')
          .select('user_id, email, full_name, company_id, role')
          .eq('company_id', companyId)
          .eq('role', 'investor');

        if (userError) {
          console.error('Error fetching from user_profiles:', userError);
        } else if (userProfilesData) {
          // Add user_profiles that aren't already in allInvestors
          const existingIds = new Set(allInvestors.map(inv => inv.id));
          const newProfiles = userProfilesData.filter((up: any) => !existingIds.has(up.user_id));
          allInvestors.push(...newProfiles.map((up: any) => ({
            id: up.user_id,
            email: up.email,
            full_name: up.full_name,
            company_id: up.company_id,
            role: up.role,
            source: 'user_profiles' as const
          })));
        }

        // Remove duplicates based on email
        const uniqueInvestors = Array.from(new Map(allInvestors.map(inv => [inv.email, inv])).values());
        
        setInvestors(uniqueInvestors);
      } catch (error) {
        console.error('Error in fetchInvestors:', error);
      } finally {
        setInvestorsLoading(false);
      }
    };

    fetchInvestors();
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowInvestorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Populate form data when editing
  React.useEffect(() => {
    if (initialData && !investorsLoading) {
      // Map stored deal_investor records back to SelectedInvestor format
      const selectedInvs: SelectedInvestor[] = [];
      if (initialData.dealInvestors && Array.isArray(initialData.dealInvestors)) {
        initialData.dealInvestors.forEach((di: any) => {
          selectedInvs.push({
            id: di.investor_id,
            source: di.investor_source || 'user_profiles'
          });
        });
      }

      // Fetch and add selected investors to the list if they're not already there
      const fetchMissingSelectedInvestors = async () => {
        const missingInvestors: Investor[] = [];
        
        for (const selected of selectedInvs) {
          // Check if investor is already in investors list
          const exists = investors.some(inv => inv.id === selected.id && inv.source === selected.source);
          if (!exists) {
            try {
              if (selected.source === 'user_profiles') {
                const { data, error } = await supabase
                  .from('user_profiles')
                  .select('user_id, email, full_name, company_id, role')
                  .eq('user_id', selected.id)
                  .single();

                if (data && !error) {
                  missingInvestors.push({
                    id: data.user_id,
                    email: data.email,
                    full_name: data.full_name,
                    company_id: data.company_id,
                    role: data.role,
                    source: 'user_profiles'
                  });
                }
              } else if (selected.source === 'investors') {
                const { data, error } = await supabase
                  .from('investors')
                  .select('id, email, full_name, company_id')
                  .eq('id', selected.id)
                  .single();
                
                if (data && !error) {
                  missingInvestors.push({
                    id: data.id,
                    email: data.email,
                    full_name: data.full_name,
                    company_id: data.company_id,
                    role: 'investor',
                    source: 'investors'
                  });
                }
              }
            } catch (error) {
              console.error(`Error fetching investor ${selected.id}:`, error);
            }
          }
        }

        // Add missing investors to the main list
        if (missingInvestors.length > 0) {
          setInvestors(prev => [...prev, ...missingInvestors]);
        }
      };

      if (selectedInvs.length > 0) {
        fetchMissingSelectedInvestors();
      }

      setFormData({
        name: initialData.name || '',
        type: initialData.type || 'Bridge Loan',
        borrowerName: initialData.borrower_name || '',
        borrowerContact: initialData.borrower_contact || '',
        propertyAddress: initialData.property_address || '',
        city: initialData.location_city || '',
        state: initialData.location_state || 'TX',
        propertyType: initialData.property_type || '',
        status: initialData.status || 'Funding',
        loanPurpose: initialData.loan_purpose || '',

        selectedInvestors: selectedInvs,
        investorNotes: initialData.investor_notes || '',

        targetAmount: initialData.target_amount?.toString() || '',
        raisedAmount: initialData.raised_amount?.toString() || '',
        minimumInvestment: initialData.minimum_investment?.toString() || '',
        interestRate: initialData.interest_rate?.toString() || '',
        termLengthMonths: initialData.term_length_months?.toString() || '12',
        fundingCloseDate: initialData.funding_close_date || '',
        firstPayoutDate: initialData.first_payout_date || '',

        collateralType: initialData.collateral_type || '',
        collateralAddress: initialData.collateral_address || '',
        estimatedPropertyValue: initialData.estimated_property_value?.toString() || '',
        loanToValueRatio: initialData.loan_to_value_ratio?.toString() || '',
        assetNotes: initialData.asset_notes || '',

        uploadedFiles: [],

        defaultInvestorAudience: initialData.default_investor_audience || '',
        enableBroadcastChannel: initialData.enable_broadcast_channel ?? true,
        enableInvestorInbox: initialData.enable_investor_inbox ?? true,
        requireInvestorAcknowledgment: initialData.require_investor_acknowledgment ?? false,
        automatedInvestorMessage: initialData.automated_investor_message || '',
        sendAutomatedMessage: initialData.send_automated_message ?? false,

        closeDate: initialData.close_date || '',
        internalApprovalDeadline: initialData.internal_approval_deadline || '',
        nextMilestone: initialData.next_milestone || '',
        milestoneType: initialData.milestone_type || 'normal',
        milestoneNotes: initialData.milestone_notes || '',

        notes: initialData.notes || '',
      });

      // If the saved city isn't in its state's curated list, start in "Other" mode
      const initState = initialData.location_state || 'TX';
      const initCity = initialData.location_city || '';
      setCityOther(!!initCity && !(CITIES_BY_STATE[initState] || []).includes(initCity));
    }
  }, [initialData, investorsLoading, investors]);

  const handleStateChange = (value: string) => {
    // Changing state invalidates the chosen city — reset it and its mode.
    setFormData(prev => ({ ...prev, state: value, city: '' }));
    setCityOther(false);
  };

  const handleCityChange = (value: string) => {
    if (value === CITY_OTHER) {
      setCityOther(true);
      setFormData(prev => ({ ...prev, city: '' }));
    } else {
      setCityOther(false);
      setFormData(prev => ({ ...prev, city: value }));
    }
  };

  const getFilteredInvestors = () => {
    if (!investorSearch.trim()) return investors;
    const search = investorSearch.toLowerCase();
    return investors.filter(inv =>
      inv.full_name?.toLowerCase().includes(search) ||
      inv.email?.toLowerCase().includes(search)
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name as keyof DealFormData] }));
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newFiles = files.map(file => ({
      file,
      type: 'Loan Agreement',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setFormData(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...newFiles],
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => {
      const updated = [...prev.uploadedFiles];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return { ...prev, uploadedFiles: updated };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving deal:', error);
      alert('Failed to save deal');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        // Keep creation unblocked: only require a deal name to proceed.
        return !!formData.name;
      case 2:
        // Investor selection is optional; allocations can be added later.
        return true;
      case 3:
        // Financial terms are optional at creation time.
        return true;
      case 4:
        // Collateral details are optional at creation time.
        return true;
      case 5:
        return true;
      case 6:
        return true;
      case 7:
        return true;
      case 8:
        return true;
      default:
        return false;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-stone-200 shadow-2xl overflow-hidden flex flex-col" style={{ width: '100%', maxWidth: '880px', height: '90vh', maxHeight: '95vh', minHeight: '600px' }}>
        {/* Header with Step Indicators - Sticky */}
        <div className="shrink-0 bg-white border-b border-stone-100">
          {/* Title and Close Button */}
          <div className="px-6 py-4 flex justify-between items-center border-b border-stone-100">
            <div>
              <h2 className="text-2xl font-display font-normal text-stone-900">{initialData ? 'Edit Deal' : 'Create New Deal'}</h2>
              <p className="text-sm text-stone-400 mt-1">{initialData ? 'Update the deal information' : 'Set up a new lending contract or investment opportunity'}</p>
            </div>
            <button onClick={onClose} className="p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition">
              <X size={20} />
            </button>
          </div>

          {/* Step Indicators */}
          <div className="px-6 py-6">
            <div className="flex items-start justify-between gap-0">
              {STEPS.map((step, idx) => (
                <div key={step.number} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                  <div className="flex items-center justify-center w-full relative mb-3">
                    {idx > 0 && (
                      <div
                        className="absolute right-1/2 h-0.5 transition-all"
                        style={{
                          width: 'calc(100% - 24px)',
                          backgroundColor: currentStep > step.number - 1 ? '#C0B87A' : '#e7e5e4',
                        }}
                      />
                    )}
                    <div
                      className={`w-9 h-9 flex items-center justify-center text-sm font-medium transition flex-shrink-0 relative z-10 ${
                        currentStep > step.number
                          ? 'bg-fundex-gold text-fundex-forest'
                          : currentStep === step.number
                          ? 'bg-fundex-gold text-fundex-forest ring-4 ring-fundex-cream'
                          : 'bg-stone-200 text-stone-400'
                      }`}
                    >
                      {currentStep > step.number ? <CheckCircle size={16} /> : step.number}
                    </div>
                  </div>
                  <p className={`text-xs font-normal text-center leading-tight whitespace-normal px-1 ${
                    currentStep >= step.number ? 'text-stone-900' : 'text-stone-400'
                  }`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground mb-4">Basic Deal Information</h3>
                <p className="text-sm text-muted-foreground mb-6">Enter the core details for this lending contract</p>
                
                <div className="space-y-4">
                  <div className="col-span-2">
                    <Label>Deal Name *</Label>
                    <Input
                      placeholder="e.g., Multifamily Bridge Loan"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Deal Type *</Label>
                      <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="Bridge Loan">Bridge Loan</SelectItem>
                          <SelectItem value="Construction">Construction</SelectItem>
                          <SelectItem value="Acquisition">Acquisition</SelectItem>
                          <SelectItem value="Development">Development</SelectItem>
                          <SelectItem value="Refinance">Refinance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Borrower Name *</Label>
                      <Input
                        placeholder="Enter borrower or entity name"
                        name="borrowerName"
                        value={formData.borrowerName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Borrower Contact</Label>
                    <Input
                      placeholder="Enter email or phone"
                      name="borrowerContact"
                      value={formData.borrowerContact}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label>Property Address *</Label>
                    <Input
                      placeholder="Street address"
                      name="propertyAddress"
                      value={formData.propertyAddress}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>City *</Label>
                      {cityOther ? (
                        <div className="space-y-1.5">
                          <Input
                            placeholder="Enter city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => { setCityOther(false); setFormData(prev => ({ ...prev, city: '' })); }}
                            className="text-xs text-fundex-forest hover:underline"
                          >
                            Choose from list
                          </button>
                        </div>
                      ) : (
                        <Select
                          value={formData.city}
                          onValueChange={handleCityChange}
                          disabled={!formData.state}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={formData.state ? 'Select city' : 'Select a state first'} />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {(CITIES_BY_STATE[formData.state] || []).map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                            <SelectItem value={CITY_OTHER}>Other…</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Select value={formData.state} onValueChange={handleStateChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="AL">AL — Alabama</SelectItem>
                          <SelectItem value="AK">AK — Alaska</SelectItem>
                          <SelectItem value="AZ">AZ — Arizona</SelectItem>
                          <SelectItem value="AR">AR — Arkansas</SelectItem>
                          <SelectItem value="CA">CA — California</SelectItem>
                          <SelectItem value="CO">CO — Colorado</SelectItem>
                          <SelectItem value="CT">CT — Connecticut</SelectItem>
                          <SelectItem value="DE">DE — Delaware</SelectItem>
                          <SelectItem value="DC">DC — District of Columbia</SelectItem>
                          <SelectItem value="FL">FL — Florida</SelectItem>
                          <SelectItem value="GA">GA — Georgia</SelectItem>
                          <SelectItem value="HI">HI — Hawaii</SelectItem>
                          <SelectItem value="ID">ID — Idaho</SelectItem>
                          <SelectItem value="IL">IL — Illinois</SelectItem>
                          <SelectItem value="IN">IN — Indiana</SelectItem>
                          <SelectItem value="IA">IA — Iowa</SelectItem>
                          <SelectItem value="KS">KS — Kansas</SelectItem>
                          <SelectItem value="KY">KY — Kentucky</SelectItem>
                          <SelectItem value="LA">LA — Louisiana</SelectItem>
                          <SelectItem value="ME">ME — Maine</SelectItem>
                          <SelectItem value="MD">MD — Maryland</SelectItem>
                          <SelectItem value="MA">MA — Massachusetts</SelectItem>
                          <SelectItem value="MI">MI — Michigan</SelectItem>
                          <SelectItem value="MN">MN — Minnesota</SelectItem>
                          <SelectItem value="MS">MS — Mississippi</SelectItem>
                          <SelectItem value="MO">MO — Missouri</SelectItem>
                          <SelectItem value="MT">MT — Montana</SelectItem>
                          <SelectItem value="NE">NE — Nebraska</SelectItem>
                          <SelectItem value="NV">NV — Nevada</SelectItem>
                          <SelectItem value="NH">NH — New Hampshire</SelectItem>
                          <SelectItem value="NJ">NJ — New Jersey</SelectItem>
                          <SelectItem value="NM">NM — New Mexico</SelectItem>
                          <SelectItem value="NY">NY — New York</SelectItem>
                          <SelectItem value="NC">NC — North Carolina</SelectItem>
                          <SelectItem value="ND">ND — North Dakota</SelectItem>
                          <SelectItem value="OH">OH — Ohio</SelectItem>
                          <SelectItem value="OK">OK — Oklahoma</SelectItem>
                          <SelectItem value="OR">OR — Oregon</SelectItem>
                          <SelectItem value="PA">PA — Pennsylvania</SelectItem>
                          <SelectItem value="RI">RI — Rhode Island</SelectItem>
                          <SelectItem value="SC">SC — South Carolina</SelectItem>
                          <SelectItem value="SD">SD — South Dakota</SelectItem>
                          <SelectItem value="TN">TN — Tennessee</SelectItem>
                          <SelectItem value="TX">TX — Texas</SelectItem>
                          <SelectItem value="UT">UT — Utah</SelectItem>
                          <SelectItem value="VT">VT — Vermont</SelectItem>
                          <SelectItem value="VA">VA — Virginia</SelectItem>
                          <SelectItem value="WA">WA — Washington</SelectItem>
                          <SelectItem value="WV">WV — West Virginia</SelectItem>
                          <SelectItem value="WI">WI — Wisconsin</SelectItem>
                          <SelectItem value="WY">WY — Wyoming</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Property Type</Label>
                    <Select value={formData.propertyType} onValueChange={(value) => handleSelectChange('propertyType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        {formData.propertyType && !PROPERTY_TYPES.includes(formData.propertyType as never) && (
                          <SelectItem value={formData.propertyType}>{formData.propertyType}</SelectItem>
                        )}
                        {PROPERTY_TYPES.map((pt) => (
                          <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Funding Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select funding status" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Funding">Funding</SelectItem>
                        <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Loan Purpose</Label>
                    <Select value={formData.loanPurpose} onValueChange={(value) => handleSelectChange('loanPurpose', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select loan purpose" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        {formData.loanPurpose && !LOAN_PURPOSES.includes(formData.loanPurpose as never) && (
                          <SelectItem value={formData.loanPurpose}>{formData.loanPurpose}</SelectItem>
                        )}
                        {LOAN_PURPOSES.map((lp) => (
                          <SelectItem key={lp} value={lp}>{lp}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Investor Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground mb-4">Select Investors</h3>
                <p className="text-sm text-muted-foreground mb-6">Search and select which investors can participate in this deal</p>

                <div className="space-y-4">
                  {investorsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading investors...</p>
                    </div>
                  ) : (
                    <>
                      {/* Search Input */}
                      <div className="relative" ref={dropdownRef}>
                        <div className="relative">
                          <Input
                            placeholder="Search by name or email..."
                            value={investorSearch}
                            onChange={(e) => setInvestorSearch(e.target.value)}
                            onFocus={() => setShowInvestorDropdown(true)}
                            className="w-full pr-10"
                          />
                        </div>

                        {/* Dropdown */}
                        {showInvestorDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-background border border-border  shadow-lg max-h-64 overflow-y-auto">
                            {getFilteredInvestors().length === 0 ? (
                              <div className="p-4 text-center text-muted-foreground">
                                {investorSearch ? 'No investors found' : 'No investors available'}
                              </div>
                            ) : (
                              <>
                                {getFilteredInvestors().map((investor) => (
                                  <div
                                    key={`${investor.source}-${investor.id}`}
                                    onClick={() => {
                                      setFormData(prev => {
                                        const isSelected = prev.selectedInvestors.some(
                                          sel => sel.id === investor.id && sel.source === investor.source
                                        );
                                        return {
                                          ...prev,
                                          selectedInvestors: isSelected
                                            ? prev.selectedInvestors.filter(
                                                sel => !(sel.id === investor.id && sel.source === investor.source)
                                              )
                                            : [...prev.selectedInvestors, { id: investor.id, source: investor.source || 'user_profiles' }]
                                        };
                                      });
                                      setInvestorSearch('');
                                    }}
                                    className={`p-4 cursor-pointer border-b last:border-b-0 transition ${
                                      formData.selectedInvestors.some(
                                        sel => sel.id === investor.id && sel.source === investor.source
                                      )
                                        ? 'bg-fundex-cream/30 border-l-4 border-l-green-600'
                                        : 'hover:bg-muted'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {formData.selectedInvestors.some(
                                        sel => sel.id === investor.id && sel.source === investor.source
                                      ) && (
                                        <div className="w-5 h-5  bg-fundex-gold flex items-center justify-center flex-shrink-0">
                                          <CheckCircle size={16} className="text-white" />
                                        </div>
                                      )}
                                      <div className="flex-1">
                                        <p className={`font-medium ${
                                          formData.selectedInvestors.some(
                                            sel => sel.id === investor.id && sel.source === investor.source
                                          )
                                            ? 'text-primary'
                                            : 'text-foreground'
                                        }`}>
                                          {investor.full_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{investor.email}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Done Button */}
                                {formData.selectedInvestors.length > 0 && (
                                  <div className="sticky bottom-0 bg-background border-t border-border p-3 flex gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => setShowInvestorDropdown(false)}
                                      className="flex-1 bg-fundex-gold hover:bg-fundex-gold/90 text-fundex-forest"
                                    >
                                      Done ({formData.selectedInvestors.length})
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Selected Investors Tags */}
                      {formData.selectedInvestors.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {formData.selectedInvestors.map(selected => {
                            const investor = investors.find(inv => inv.id === selected.id && inv.source === selected.source);
                            return investor ? (
                              <div key={`${selected.source}-${selected.id}`} className="bg-fundex-gold/10 text-fundex-forest px-3 py-2  text-sm font-medium flex items-center gap-2">
                                <span>{investor.full_name}</span>
                                <button
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedInvestors: prev.selectedInvestors.filter(
                                        sel => !(sel.id === selected.id && sel.source === selected.source)
                                      )
                                    }));
                                  }}
                                  className="text-primary hover:text-primary font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </>
                  )}

                  <div className="mt-6">
                    <Label>Additional Investor Notes</Label>
                    <Textarea
                      placeholder="Add any notes about investor participation or requirements..."
                      name="investorNotes"
                      value={formData.investorNotes}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Financial Terms */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground mb-4">Financial Terms</h3>
                <p className="text-sm text-muted-foreground mb-6">Define the investment structure and returns</p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Target Raise ($) *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 12500000"
                        name="targetAmount"
                        value={formData.targetAmount}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label>Raised Amount ($)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 8000000"
                        name="raisedAmount"
                        value={formData.raisedAmount}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Minimum Investment ($) *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 50000"
                        name="minimumInvestment"
                        value={formData.minimumInvestment}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label>Interest Rate (%) *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 12.5"
                        name="interestRate"
                        value={formData.interestRate}
                        onChange={handleInputChange}
                        step="0.1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Term Length (months) *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 18"
                        name="termLengthMonths"
                        value={formData.termLengthMonths}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Funding Close Date</Label>
                      <Input
                        type="date"
                        name="fundingCloseDate"
                        value={formData.fundingCloseDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label>First Payout Date</Label>
                      <Input
                        type="date"
                        name="firstPayoutDate"
                        value={formData.firstPayoutDate}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Collateral */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground mb-4">Collateral / Asset Information</h3>
                <p className="text-sm text-muted-foreground mb-6">Details about the underlying asset securing this loan</p>

                <div className="space-y-4">
                  <div>
                    <Label>Collateral Type *</Label>
                    <Select value={formData.collateralType || undefined} onValueChange={(value) => handleSelectChange('collateralType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select collateral type" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="Real Estate">Real Estate</SelectItem>
                        <SelectItem value="Commercial Property">Commercial Property</SelectItem>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Mixed Use">Mixed Use</SelectItem>
                        <SelectItem value="Land">Land</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Collateral Address *</Label>
                    <Input
                      placeholder="Full address of collateral property"
                      name="collateralAddress"
                      value={formData.collateralAddress}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Estimated Property Value ($) *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 18000000"
                        name="estimatedPropertyValue"
                        value={formData.estimatedPropertyValue}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label>Loan-to-Value (LTV %) *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 65"
                        name="loanToValueRatio"
                        value={formData.loanToValueRatio}
                        onChange={handleInputChange}
                        step="0.1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Asset Notes</Label>
                    <Textarea
                      placeholder="Additional notes about the collateral or property condition..."
                      name="assetNotes"
                      value={formData.assetNotes}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Documents */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground mb-4">Documents</h3>
                <p className="text-sm text-muted-foreground mb-6">Upload critical deal documents and legal files</p>

                <div className="space-y-4">
                  <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed  p-8 text-center transition ${
                      isDragActive ? 'border-primary bg-fundex-cream/30' : 'border-border'
                    }`}
                  >
                    <Upload className="mx-auto mb-3 text-muted-foreground" size={32} />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Drag and drop files here
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">or</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select Files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                  </div>

                  {formData.uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">Uploaded Files ({formData.uploadedFiles.length})</p>
                      {formData.uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted ">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText size={20} className="text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{file.file.name}</p>
                              <p className="text-xs text-muted-foreground">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="p-1 hover:bg-red-50 text-red-600 rounded transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Communication */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground mb-4">Communication Settings</h3>
                <p className="text-sm text-muted-foreground mb-6">Configure how you'll communicate with investors on this deal</p>

                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Default Investor Audience</Label>
                    <Select value={formData.defaultInvestorAudience || undefined} onValueChange={(value) => handleSelectChange('defaultInvestorAudience', value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select default audience" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="all">All Investors</SelectItem>
                        <SelectItem value="accredited">Accredited Investors</SelectItem>
                        <SelectItem value="qualified">Qualified Investors</SelectItem>
                        <SelectItem value="custom">Custom List</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Checkbox Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-foreground block">
                          Enable Broadcast Channel
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">Allow one-way announcements to investors</p>
                      </div>
                      <Switch
                        checked={formData.enableBroadcastChannel}
                        onCheckedChange={() => handleCheckboxChange('enableBroadcastChannel')}
                        className="data-[state=checked]:bg-fundex-gold"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-foreground block">
                          Enable Investor Inbox
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">Allow two-way messaging with investors</p>
                      </div>
                      <Switch
                        checked={formData.enableInvestorInbox}
                        onCheckedChange={() => handleCheckboxChange('enableInvestorInbox')}
                        className="data-[state=checked]:bg-fundex-gold"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-foreground block">
                          Require Investor Acknowledgment for Major Updates
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">Investors must confirm receipt of critical updates</p>
                      </div>
                      <Switch
                        checked={formData.requireInvestorAcknowledgment}
                        onCheckedChange={() => handleCheckboxChange('requireInvestorAcknowledgment')}
                        className="data-[state=checked]:bg-fundex-gold"
                      />
                    </div>
                  </div>

                  {/* Automated Message Section */}
                  <div className="border-t border-border pt-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <Label className="text-sm font-semibold text-foreground">Automated Investor Message</Label>
                        <p className="text-xs text-muted-foreground mt-1">Automatically notify investors when this deal is created or opened for funding</p>
                      </div>
                      <Switch
                        checked={formData.sendAutomatedMessage}
                        onCheckedChange={() => handleCheckboxChange('sendAutomatedMessage')}
                        className="data-[state=checked]:bg-fundex-gold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Milestones */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground mb-4">Milestones / Timeline</h3>
                <p className="text-sm text-muted-foreground mb-6">Set key dates and deadlines for this deal</p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Funding Close Date</Label>
                      <Input
                        type="date"
                        name="closeDate"
                        value={formData.closeDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label>First Payout Date</Label>
                      <Input
                        type="date"
                        name="firstPayoutDate"
                        value={formData.firstPayoutDate}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Internal Approval Deadline</Label>
                    <Input
                      type="date"
                      name="internalApprovalDeadline"
                      value={formData.internalApprovalDeadline}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label>Next Milestone / Key Event</Label>
                    <Input
                      placeholder="e.g., Closing in 3 days"
                      name="nextMilestone"
                      value={formData.nextMilestone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label>Milestone Priority</Label>
                    <Select value={formData.milestoneType} onValueChange={(value) => handleSelectChange('milestoneType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="attention">Needs Attention</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Optional Milestone Notes</Label>
                    <Textarea
                      placeholder="Add any additional timeline notes or special considerations..."
                      name="milestoneNotes"
                      value={formData.milestoneNotes}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Review */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground mb-4">Review Deal Details</h3>
                <p className="text-sm text-muted-foreground mb-6">Review all information before creating the deal</p>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-muted  p-4">
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{formData.name}</span></p>
                        <p><span className="text-muted-foreground">Type:</span> <span className="font-medium">{formData.type}</span></p>
                        <p><span className="text-muted-foreground">Borrower:</span> <span className="font-medium">{formData.borrowerName}</span></p>
                        <p><span className="text-muted-foreground">Location:</span> <span className="font-medium">{formData.city}, {formData.state}</span></p>
                      </div>
                    </div>

                    <div className="bg-muted  p-4">
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Financial Terms</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Target Raise:</span> <span className="font-medium">${parseFloat(formData.targetAmount || '0').toLocaleString()}</span></p>
                        <p><span className="text-muted-foreground">Min. Investment:</span> <span className="font-medium">${parseFloat(formData.minimumInvestment || '0').toLocaleString()}</span></p>
                        <p><span className="text-muted-foreground">Interest Rate:</span> <span className="font-medium">{formData.interestRate}%</span></p>
                        <p><span className="text-muted-foreground">Term:</span> <span className="font-medium">{formData.termLengthMonths} months</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-muted  p-4">
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Collateral</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Type:</span> <span className="font-medium">{formData.collateralType}</span></p>
                        <p><span className="text-muted-foreground">Address:</span> <span className="font-medium">{formData.collateralAddress}</span></p>
                        <p><span className="text-muted-foreground">Est. Value:</span> <span className="font-medium">${parseFloat(formData.estimatedPropertyValue || '0').toLocaleString()}</span></p>
                        <p><span className="text-muted-foreground">LTV:</span> <span className="font-medium">{formData.loanToValueRatio}%</span></p>
                      </div>
                    </div>

                    <div className="bg-muted  p-4">
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Documents & Timeline</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Uploaded Files:</span> <span className="font-medium">{formData.uploadedFiles.length}</span></p>
                        <p><span className="text-muted-foreground">Funding Close:</span> <span className="font-medium">{formData.fundingCloseDate || 'Not set'}</span></p>
                        <p><span className="text-muted-foreground">Next Milestone:</span> <span className="font-medium">{formData.nextMilestone || 'Not set'}</span></p>
                        <p><span className="text-muted-foreground">Milestone Type:</span> <span className="font-medium capitalize">{formData.milestoneType}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200  p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Ready to create?</strong> Click "Create Deal" below to finalize this deal and make it visible to investors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer — pinned to bottom */}
        <div className="shrink-0 border-t border-stone-100 bg-white px-6 py-4 flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
            className="gap-2"
          >
            <ChevronLeft size={18} />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex gap-2">
            {currentStep < 8 && (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNext()}
                className="gap-2 bg-fundex-gold text-fundex-forest hover:bg-fundex-gold/90 disabled:opacity-50"
              >
                Next
                <ChevronRight size={18} />
              </Button>
            )}
            {currentStep === 8 && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="gap-2 bg-fundex-gold text-fundex-forest hover:bg-fundex-gold/90 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Deal'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
