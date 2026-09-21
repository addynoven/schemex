import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCheckStore } from '../store/check.store';
import { StepProgressHeader } from '../components/StepProgressHeader';
import { OccupationSelector } from '../components/OccupationSelector';
import { CategorySelector } from '../components/CategorySelector';
import { EligibleSchemeCard } from '../components/EligibleSchemeCard';
import { NearlyEligibleCard } from '../components/NearlyEligibleCard';
import { BenefitType, GenderType, SocialCategory } from '../models/check.model';
import { spacing } from '@/core/theme/spacing';
import { useRouter } from 'expo-router';
import { toastService } from '@/core/components/Toast';
import { ALL_INDIAN_STATES, POPULAR_STATES, getDistrictsForState } from '../data/indiaLocations';

// =========================================================================
// SCREEN 0: START
// =========================================================================
export const StartScreen: React.FC = () => {
  const { setStep } = useCheckStore();

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Check Eligibility</Text>
          <Text style={styles.headerSubtitle}>
            Find government schemes that match your profile
          </Text>
        </View>

        {/* Hero Visual Card: Indian Citizens */}
        <View style={styles.startHeroCard}>
          <View style={styles.citizensRow}>
            {/* Farmer */}
            <View style={styles.citizenAvatar}>
              <View style={[styles.avatarCircle, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                <FontAwesome name="leaf" size={24} color="#D97706" />
              </View>
              <Text style={styles.citizenLabel}>Farmer</Text>
            </View>

            {/* Student */}
            <View style={styles.citizenAvatar}>
              <View style={[styles.avatarCircle, { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }]}>
                <FontAwesome name="graduation-cap" size={24} color="#1D4ED8" />
              </View>
              <Text style={styles.citizenLabel}>Student</Text>
            </View>

            {/* Rural Woman */}
            <View style={styles.citizenAvatar}>
              <View style={[styles.avatarCircle, { backgroundColor: '#FFEDD5', borderColor: '#EA580C' }]}>
                <FontAwesome name="female" size={26} color="#C2410C" />
              </View>
              <Text style={styles.citizenLabel}>Citizen</Text>
            </View>
          </View>
          <Text style={styles.heroBadgeText}>Matching Central & State Welfare Schemes</Text>
        </View>

        {/* Value Propositions */}
        <View style={styles.valuePropsList}>
          <View style={styles.valuePropItem}>
            <View style={styles.valuePropIcon}>
              <FontAwesome name="check-square-o" size={16} color="#047857" />
            </View>
            <Text style={styles.valuePropText}>Just 3 simple steps</Text>
          </View>

          <View style={styles.valuePropItem}>
            <View style={styles.valuePropIcon}>
              <FontAwesome name="user" size={16} color="#047857" />
            </View>
            <Text style={styles.valuePropText}>Personalized results for your family</Text>
          </View>

          <View style={styles.valuePropItem}>
            <View style={styles.valuePropIcon}>
              <FontAwesome name="folder-open-o" size={16} color="#047857" />
            </View>
            <Text style={styles.valuePropText}>Uses your saved documents in Vault</Text>
          </View>

          <View style={styles.valuePropItem}>
            <View style={styles.valuePropIcon}>
              <FontAwesome name="shield" size={16} color="#047857" />
            </View>
            <Text style={styles.valuePropText}>100% private & secure</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setStep('1_demographics')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Let's Get Started</Text>
          <FontAwesome name="arrow-right" size={14} color="#FFFFFF" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =========================================================================
// SCREEN 1: DEMOGRAPHICS (Step 1/3)
// =========================================================================
export const DemographicsScreen: React.FC = () => {
  const { formData, updateDemographics, setStep } = useCheckStore();
  const demo = formData.demographics;

  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [showCustomDistrict, setShowCustomDistrict] = useState(false);
  const [customDistrictText, setCustomDistrictText] = useState('');

  const currentDistricts = getDistrictsForState(demo.state);

  const filteredStates = ALL_INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase().trim())
  );

  const filteredDistricts = currentDistricts.filter((d) =>
    d.toLowerCase().includes(districtSearch.toLowerCase().trim())
  );

  const handleSelectState = (st: string) => {
    const districts = getDistrictsForState(st);
    const newDistrict = districts.length > 0 ? districts[0] : 'All Districts';
    updateDemographics({ state: st, district: newDistrict });
    setShowCustomDistrict(false);
    setStateModalVisible(false);
    setStateSearch('');
  };

  const handleSelectDistrict = (dist: string) => {
    updateDemographics({ district: dist });
    setShowCustomDistrict(false);
    setDistrictModalVisible(false);
    setDistrictSearch('');
  };

  const handleCustomDistrictSubmit = () => {
    if (customDistrictText.trim()) {
      updateDemographics({ district: customDistrictText.trim() });
      setShowCustomDistrict(false);
      setDistrictModalVisible(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <StepProgressHeader currentStep={1} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.formHeader}>
          <Text style={styles.formStepTag}>STEP 1 OF 3</Text>
          <Text style={styles.formTitle}>Demographics</Text>
          <Text style={styles.formSubtitle}>Tell us about yourself</Text>
        </View>

        {/* Date of Birth */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Date of Birth</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.textInput}
              value={demo.dob}
              onChangeText={(t) => updateDemographics({ dob: t })}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#94A3B8"
            />
            <FontAwesome name="calendar" size={16} color="#64748B" style={styles.inputRightIcon} />
          </View>
        </View>

        {/* Gender Selection */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {(['male', 'female', 'other'] as GenderType[]).map((g) => {
              const isSelected = demo.gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderPill, isSelected && styles.genderPillActive]}
                  onPress={() => updateDemographics({ gender: g })}
                  activeOpacity={0.7}
                >
                  <FontAwesome
                    name={g === 'female' ? 'female' : 'male'}
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#64748B'}
                    style={styles.genderIcon}
                  />
                  <Text style={[styles.genderText, isSelected && styles.genderTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* State Selection */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>State / Union Territory</Text>
          {/* Dropdown selector matching design */}
          <TouchableOpacity
            style={styles.dropdownSelector}
            onPress={() => setStateModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dropdownLeft}>
              <FontAwesome name="map-marker" size={16} color="#047857" style={styles.dropdownIcon} />
              <Text style={styles.dropdownValue}>{demo.state || 'Select State'}</Text>
            </View>
            <FontAwesome name="chevron-down" size={12} color="#64748B" />
          </TouchableOpacity>

          {/* Quick Select Popular States */}
          <View style={styles.quickChipsContainer}>
            <Text style={styles.quickChipsLabel}>Quick Select State:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsScroll}>
              {POPULAR_STATES.map((st) => {
                const isSelected = demo.state === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                    onPress={() => handleSelectState(st)}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={styles.moreStatesChip}
                onPress={() => setStateModalVisible(true)}
              >
                <Text style={styles.moreStatesChipText}>All 36 States ▾</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* District Selection */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>District ({demo.state})</Text>
          {/* Dropdown selector matching design */}
          <TouchableOpacity
            style={styles.dropdownSelector}
            onPress={() => setDistrictModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dropdownLeft}>
              <FontAwesome name="building-o" size={15} color="#047857" style={styles.dropdownIcon} />
              <Text style={styles.dropdownValue}>{demo.district || 'Select District'}</Text>
            </View>
            <FontAwesome name="chevron-down" size={12} color="#64748B" />
          </TouchableOpacity>

          {/* Quick Select Districts for Selected State */}
          <View style={styles.quickChipsContainer}>
            <Text style={styles.quickChipsLabel}>Districts in {demo.state}:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsScroll}>
              {currentDistricts.slice(0, 8).map((dst) => {
                const isSelected = demo.district === dst;
                return (
                  <TouchableOpacity
                    key={dst}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                    onPress={() => handleSelectDistrict(dst)}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                      {dst}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {currentDistricts.length > 8 && (
                <TouchableOpacity
                  style={styles.moreStatesChip}
                  onPress={() => setDistrictModalVisible(true)}
                >
                  <Text style={styles.moreStatesChipText}>More ({currentDistricts.length}) ▾</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Custom District Input Toggle */}
          {showCustomDistrict ? (
            <View style={styles.customDistrictContainer}>
              <TextInput
                style={styles.customDistrictInput}
                placeholder="Type your district / city name"
                placeholderTextColor="#94A3B8"
                value={customDistrictText}
                onChangeText={setCustomDistrictText}
                autoFocus
              />
              <TouchableOpacity
                style={styles.customDistrictApplyBtn}
                onPress={handleCustomDistrictSubmit}
              >
                <Text style={styles.customDistrictApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.customDistrictToggle}
              onPress={() => {
                setShowCustomDistrict(true);
                setCustomDistrictText(demo.district);
              }}
            >
              <FontAwesome name="pencil" size={12} color="#047857" style={{ marginRight: 6 }} />
              <Text style={styles.customDistrictToggleText}>Can't find your district? Enter manually</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* State Search Modal */}
      <Modal
        visible={stateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select State / UT</Text>
              <TouchableOpacity
                onPress={() => setStateModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <FontAwesome name="search" size={14} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search state (e.g. Goa, Delhi...)"
                placeholderTextColor="#94A3B8"
                value={stateSearch}
                onChangeText={setStateSearch}
                autoFocus
              />
              {stateSearch ? (
                <TouchableOpacity onPress={() => setStateSearch('')}>
                  <FontAwesome name="times-circle" size={14} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <FlatList
              data={filteredStates}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = demo.state === item;
                return (
                  <TouchableOpacity
                    style={[styles.modalItemRow, isSelected && styles.modalItemRowSelected]}
                    onPress={() => handleSelectState(item)}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {item}
                    </Text>
                    {isSelected && <FontAwesome name="check" size={14} color="#047857" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* District Search Modal */}
      <Modal
        visible={districtModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDistrictModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select District in {demo.state}</Text>
              <TouchableOpacity
                onPress={() => setDistrictModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <FontAwesome name="search" size={14} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={`Search district in ${demo.state}...`}
                placeholderTextColor="#94A3B8"
                value={districtSearch}
                onChangeText={setDistrictSearch}
                autoFocus
              />
              {districtSearch ? (
                <TouchableOpacity onPress={() => setDistrictSearch('')}>
                  <FontAwesome name="times-circle" size={14} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <FlatList
              data={filteredDistricts}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = demo.district === item;
                return (
                  <TouchableOpacity
                    style={[styles.modalItemRow, isSelected && styles.modalItemRowSelected]}
                    onPress={() => handleSelectDistrict(item)}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {item}
                    </Text>
                    {isSelected && <FontAwesome name="check" size={14} color="#047857" />}
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                <View style={styles.modalFooterInput}>
                  <Text style={styles.modalFooterLabel}>Or enter custom district name:</Text>
                  <View style={styles.customDistrictContainer}>
                    <TextInput
                      style={styles.customDistrictInput}
                      placeholder="Enter custom district"
                      placeholderTextColor="#94A3B8"
                      value={customDistrictText}
                      onChangeText={setCustomDistrictText}
                    />
                    <TouchableOpacity
                      style={styles.customDistrictApplyBtn}
                      onPress={handleCustomDistrictSubmit}
                    >
                      <Text style={styles.customDistrictApplyText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Sticky Bottom CTA */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setStep('2_economic')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Next: Economic Details</Text>
          <FontAwesome name="arrow-right" size={14} color="#FFFFFF" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =========================================================================
// SCREEN 2: ECONOMIC DETAILS (Step 2/3)
// =========================================================================
export const EconomicScreen: React.FC = () => {
  const { formData, updateEconomic, setStep } = useCheckStore();
  const eco = formData.economic;

  const [customIncomeText, setCustomIncomeText] = useState(
    eco.annualIncome > 0 ? String(eco.annualIncome) : ''
  );

  const incomePresets = [
    { label: '0', value: 0 },
    { label: '₹1.2L', value: 120000 },
    { label: '₹2.5L', value: 250000 },
    { label: '₹5L', value: 500000 },
    { label: '₹10L+', value: 1000000 },
  ];

  const handleCustomIncomeChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setCustomIncomeText(cleaned);
    const num = parseInt(cleaned, 10);
    updateEconomic({ annualIncome: isNaN(num) ? 0 : num });
  };

  const handlePresetSelect = (val: number) => {
    updateEconomic({ annualIncome: val });
    setCustomIncomeText(val > 0 ? String(val) : '');
  };

  return (
    <View style={styles.screenContainer}>
      <StepProgressHeader currentStep={2} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.formHeader}>
          <Text style={styles.formStepTag}>STEP 2 OF 3</Text>
          <Text style={styles.formTitle}>Economic Details</Text>
          <Text style={styles.formSubtitle}>Your financial profile</Text>
        </View>

        {/* Occupation Grid */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Occupation</Text>
          <OccupationSelector
            selected={eco.occupation}
            onSelect={(occ) => updateEconomic({ occupation: occ })}
          />
        </View>

        {/* Social Category */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Social Category</Text>
          <CategorySelector
            selected={eco.category}
            onSelect={(cat) => updateEconomic({ category: cat })}
          />
        </View>

        {/* Annual Income */}
        <View style={styles.fieldGroup}>
          <View style={styles.incomeHeaderRow}>
            <Text style={styles.fieldLabel}>
              Annual Income <Text style={styles.fieldLabelSub}>(₹ per year)</Text>
            </Text>
            <View style={styles.incomeValueBadge}>
              <Text style={styles.incomeValueText}>
                ₹{eco.annualIncome.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Preset Buttons */}
          <View style={styles.incomePresetsRow}>
            {incomePresets.map((preset) => {
              const isSelected = eco.annualIncome === preset.value;
              return (
                <TouchableOpacity
                  key={preset.value}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => handlePresetSelect(preset.value)}
                >
                  <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Numeric Income Input */}
          <View style={styles.customIncomeBox}>
            <Text style={styles.customIncomeLabel}>Or enter exact annual income:</Text>
            <View style={styles.customIncomeInputRow}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                style={styles.customIncomeInput}
                keyboardType="numeric"
                value={customIncomeText}
                onChangeText={handleCustomIncomeChange}
                placeholder="e.g. 180000"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setStep('3_assets')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Next: Assets & Others</Text>
          <FontAwesome name="arrow-right" size={14} color="#FFFFFF" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =========================================================================
// SCREEN 3: ASSETS & OTHERS (Step 3/3)
// =========================================================================
export const AssetsScreen: React.FC = () => {
  const { formData, updateAssets, setStep } = useCheckStore();
  const assets = formData.assets;

  return (
    <View style={styles.screenContainer}>
      <StepProgressHeader currentStep={3} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.formHeader}>
          <Text style={styles.formStepTag}>STEP 3 OF 3</Text>
          <Text style={styles.formTitle}>Assets & Others</Text>
          <Text style={styles.formSubtitle}>Additional criteria details</Text>
        </View>

        {/* Agricultural Land */}
        <View style={styles.toggleRowContainer}>
          <View style={styles.toggleHeader}>
            <Text style={styles.toggleLabel}>Do you own agricultural land?</Text>
            <Switch
              value={assets.ownsLand}
              onValueChange={(val) => updateAssets({ ownsLand: val })}
              trackColor={{ false: '#E2E8F0', true: '#047857' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {assets.ownsLand && (
            <View style={styles.expandedSubCard}>
              <View style={styles.subCardHeader}>
                <FontAwesome name="check-circle" size={14} color="#047857" style={{ marginRight: 6 }} />
                <Text style={styles.subCardTitle}>Yes, I own agricultural land</Text>
              </View>
              <Text style={styles.subCardInputLabel}>Approximate land size (in acres)</Text>
              <TextInput
                style={styles.subCardInput}
                value={String(assets.landSizeAcres)}
                onChangeText={(val) => updateAssets({ landSizeAcres: Number(val) || 0 })}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        {/* PwD */}
        <View style={styles.toggleRowContainer}>
          <View style={styles.toggleHeader}>
            <Text style={styles.toggleLabel}>Are you a person with disability (PwD)?</Text>
            <Switch
              value={assets.isPwd}
              onValueChange={(val) => updateAssets({ isPwd: val })}
              trackColor={{ false: '#E2E8F0', true: '#047857' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Widow / Single Parent */}
        <View style={styles.toggleRowContainer}>
          <View style={styles.toggleHeader}>
            <Text style={styles.toggleLabel}>Are you a widow / single parent?</Text>
            <Switch
              value={assets.isWidowSingleParent}
              onValueChange={(val) => updateAssets({ isWidowSingleParent: val })}
              trackColor={{ false: '#E2E8F0', true: '#047857' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Ration Card */}
        <View style={styles.toggleRowContainer}>
          <View style={styles.toggleHeader}>
            <Text style={styles.toggleLabel}>Do you have a ration card?</Text>
            <Switch
              value={assets.hasRationCard}
              onValueChange={(val) => updateAssets({ hasRationCard: val })}
              trackColor={{ false: '#E2E8F0', true: '#047857' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Rural Area */}
        <View style={styles.toggleRowContainer}>
          <View style={styles.toggleHeader}>
            <Text style={styles.toggleLabel}>Do you live in a rural area?</Text>
            <Switch
              value={assets.isRural}
              onValueChange={(val) => updateAssets({ isRural: val })}
              trackColor={{ false: '#E2E8F0', true: '#047857' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setStep('4_review')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Review & Check</Text>
          <FontAwesome name="arrow-right" size={14} color="#FFFFFF" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =========================================================================
// SCREEN 4: REVIEW INFORMATION
// =========================================================================
export const ReviewScreen: React.FC = () => {
  const { formData, setStep } = useCheckStore();
  const { demographics, economic, assets } = formData;

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Review Your Information</Text>
          <Text style={styles.formSubtitle}>Please confirm your details</Text>
        </View>

        {/* Demographics Card */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardHeader}>
            <Text style={styles.reviewCardTitle}>Demographics</Text>
            <TouchableOpacity onPress={() => setStep('1_demographics')}>
              <FontAwesome name="pencil" size={14} color="#047857" />
            </TouchableOpacity>
          </View>
          <View style={styles.reviewLine}>
            <FontAwesome name="user-o" size={13} color="#64748B" style={styles.reviewIcon} />
            <Text style={styles.reviewText}>
              {demographics.dob} | {demographics.gender.toUpperCase()}
            </Text>
          </View>
          <View style={styles.reviewLine}>
            <FontAwesome name="map-marker" size={13} color="#64748B" style={styles.reviewIcon} />
            <Text style={styles.reviewText}>
              {demographics.state}, {demographics.district}
            </Text>
          </View>
        </View>

        {/* Economic Details Card */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardHeader}>
            <Text style={styles.reviewCardTitle}>Economic Details</Text>
            <TouchableOpacity onPress={() => setStep('2_economic')}>
              <FontAwesome name="pencil" size={14} color="#047857" />
            </TouchableOpacity>
          </View>
          <View style={styles.reviewLine}>
            <FontAwesome name="briefcase" size={13} color="#64748B" style={styles.reviewIcon} />
            <Text style={styles.reviewText}>
              {economic.occupation.toUpperCase()}
            </Text>
          </View>
          <View style={styles.reviewLine}>
            <FontAwesome name="money" size={13} color="#64748B" style={styles.reviewIcon} />
            <Text style={styles.reviewText}>
              Annual Income: ₹{economic.annualIncome.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.reviewLine}>
            <FontAwesome name="tag" size={13} color="#64748B" style={styles.reviewIcon} />
            <Text style={styles.reviewText}>
              Category: {economic.category.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Assets & Others Card */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardHeader}>
            <Text style={styles.reviewCardTitle}>Assets & Others</Text>
            <TouchableOpacity onPress={() => setStep('3_assets')}>
              <FontAwesome name="pencil" size={14} color="#047857" />
            </TouchableOpacity>
          </View>
          <View style={styles.reviewLine}>
            <FontAwesome name="globe" size={13} color="#64748B" style={styles.reviewIcon} />
            <Text style={styles.reviewText}>
              Owns Land: {assets.ownsLand ? `Yes (${assets.landSizeAcres} acres)` : 'No'}
            </Text>
          </View>
          <View style={styles.reviewLine}>
            <FontAwesome name="wheelchair" size={13} color="#64748B" style={styles.reviewIcon} />
            <Text style={styles.reviewText}>Disability (PwD): {assets.isPwd ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.reviewLine}>
            <FontAwesome name="heart-o" size={13} color="#64748B" style={styles.reviewIcon} />
            <Text style={styles.reviewText}>
              Widow / Single Parent: {assets.isWidowSingleParent ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.reviewLine}>
            <FontAwesome name="id-card-o" size={13} color="#64748B" style={styles.reviewIcon} />
            <Text style={styles.reviewText}>Ration Card: {assets.hasRationCard ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.reviewLine}>
            <FontAwesome name="home" size={13} color="#64748B" style={styles.reviewIcon} />
            <Text style={styles.reviewText}>Rural Area: {assets.isRural ? 'Yes' : 'No'}</Text>
          </View>
        </View>

        {/* Privacy Callout */}
        <View style={styles.privacyNoticeBox}>
          <FontAwesome name="info-circle" size={15} color="#0369A1" style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.privacyNoticeText}>
            We use this information only to match relevant government schemes. Your data is secure and private.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setStep('5_processing')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Check My Schemes</Text>
          <FontAwesome name="arrow-right" size={14} color="#FFFFFF" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =========================================================================
// SCREEN 5: PROCESSING
// =========================================================================
export const ProcessingScreen: React.FC = () => {
  const { setStep, fetchEvaluation } = useCheckStore();
  const [completedSteps, setCompletedSteps] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function runLiveEvaluation() {
      try {
        setCompletedSteps(2);
        const evalPromise = fetchEvaluation();
        setTimeout(() => {
          if (isMounted) setCompletedSteps(3);
        }, 120);
        setTimeout(() => {
          if (isMounted) setCompletedSteps(4);
        }, 220);
        await evalPromise;
        if (isMounted) {
          setCompletedSteps(4);
          setStep('6_results_summary');
        }
      } catch {
        if (isMounted) {
          setStep('6_results_summary');
        }
      }
    }

    void runLiveEvaluation();

    return () => {
      isMounted = false;
    };
  }, [fetchEvaluation, setStep]);

  return (
    <View style={styles.screenContainer}>
      <View style={styles.processingContent}>
        {/* Glowing Badge with Magnifying Glass */}
        <View style={styles.processingGlowOuter}>
          <View style={styles.processingGlowInner}>
            <View style={styles.documentCardVisual}>
              <View style={styles.docLine1} />
              <View style={styles.docLine2} />
              <View style={styles.docLine3} />
            </View>
            <FontAwesome name="search" size={32} color="#047857" style={styles.searchGlassIcon} />
          </View>
        </View>

        <Text style={styles.processingTitle}>Checking Eligibility</Text>
        <Text style={styles.processingSubtitle}>Matching you with government schemes</Text>

        {/* Sequential Steps Checklist */}
        <View style={styles.checklistContainer}>
          <View style={styles.checklistItem}>
            <View style={[styles.statusDot, completedSteps >= 1 && styles.statusDotDone]}>
              {completedSteps >= 1 ? (
                <FontAwesome name="check" size={11} color="#FFFFFF" />
              ) : (
                <ActivityIndicator size="small" color="#94A3B8" />
              )}
            </View>
            <Text style={styles.checklistText}>Analyzing your profile</Text>
          </View>

          <View style={styles.checklistItem}>
            <View style={[styles.statusDot, completedSteps >= 2 && styles.statusDotDone]}>
              {completedSteps >= 2 ? (
                <FontAwesome name="check" size={11} color="#FFFFFF" />
              ) : completedSteps === 1 ? (
                <ActivityIndicator size="small" color="#047857" />
              ) : null}
            </View>
            <Text style={styles.checklistText}>Matching with active central & state schemes</Text>
          </View>

          <View style={styles.checklistItem}>
            <View style={[styles.statusDot, completedSteps >= 3 && styles.statusDotDone]}>
              {completedSteps >= 3 ? (
                <FontAwesome name="check" size={11} color="#FFFFFF" />
              ) : completedSteps === 2 ? (
                <ActivityIndicator size="small" color="#047857" />
              ) : null}
            </View>
            <Text style={styles.checklistText}>Applying state & category filters</Text>
          </View>

          <View style={styles.checklistItem}>
            <View style={[styles.statusDot, completedSteps >= 4 && styles.statusDotDone]}>
              {completedSteps >= 4 ? (
                <FontAwesome name="check" size={11} color="#FFFFFF" />
              ) : (
                <ActivityIndicator size="small" color="#047857" />
              )}
            </View>
            <Text style={styles.checklistText}>Calculating benefit estimates</Text>
          </View>
        </View>

        {/* Helper Tip */}
        <View style={styles.processingTipBox}>
          <FontAwesome name="bolt" size={16} color="#047857" style={{ marginRight: 8 }} />
          <Text style={styles.processingTipText}>Evaluating 4,000+ national and state schemes...</Text>
        </View>

        {/* Manual Skip Button */}
        <TouchableOpacity
          style={styles.skipProcessingButton}
          onPress={() => setStep('6_results_summary')}
        >
          <Text style={styles.skipProcessingText}>Skip to Results →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =========================================================================
// SCREEN 6: RESULTS SUMMARY
// =========================================================================
export const ResultsScreen: React.FC = () => {
  const router = useRouter();
  const {
    getEvaluation,
    resultsFilter,
    setResultsFilter,
    setStep,
  } = useCheckStore();

  const summary = getEvaluation();
  const schemes = summary.eligibleSchemes.filter((s) => {
    if (resultsFilter === 'all') return true;
    return s.benefitType === resultsFilter;
  });

  const filterTabs: { id: 'all' | BenefitType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: summary.totalEligibleCount },
    {
      id: 'cash',
      label: 'Cash Grants',
      count: summary.eligibleSchemes.filter((s) => s.benefitType === 'cash').length,
    },
    {
      id: 'subsidy',
      label: 'Subsidies',
      count: summary.eligibleSchemes.filter((s) => s.benefitType === 'subsidy').length,
    },
    {
      id: 'loan',
      label: 'Loans',
      count: summary.eligibleSchemes.filter((s) => s.benefitType === 'loan').length,
    },
  ];

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Celebration Banner */}
        <View style={styles.celebrationBanner}>
          <View style={styles.celebrationCircle}>
            <FontAwesome name="check" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.celebrationSub}>You are eligible for</Text>
          <Text style={styles.celebrationCount}>{summary.totalEligibleCount} schemes</Text>
          <Text style={styles.celebrationValue}>
            worth <Text style={styles.celebrationHighlight}>{summary.totalBenefitEstimate}</Text>
          </Text>
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsRow}
        >
          {filterTabs.map((tab) => {
            const isSelected = resultsFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterTabPill, isSelected && styles.filterTabPillActive]}
                onPress={() => setResultsFilter(tab.id)}
              >
                <Text
                  style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Schemes Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Eligible Schemes</Text>
          <Text style={styles.sectionHeaderCount}>{schemes.length} available</Text>
        </View>

        {/* Schemes List */}
        {schemes.map((scheme) => (
          <EligibleSchemeCard
            key={scheme.id}
            scheme={scheme}
            onApply={(s) =>
              toastService.show(`Redirecting to official portal for ${s.name}...`, 'info')
            }
            onViewDetails={(s) => {
              router.push({
                pathname: '/schemes/[id]',
                params: { id: s.id },
              });
            }}
          />
        ))}

        {/* Link to Nearly Eligible Schemes */}
        <TouchableOpacity
          style={styles.nearlyEligibleBanner}
          onPress={() => setStep('9_nearly_eligible')}
          activeOpacity={0.8}
        >
          <View style={styles.nearlyBannerLeft}>
            <FontAwesome name="info-circle" size={18} color="#EA580C" style={{ marginRight: 8 }} />
            <Text style={styles.nearlyBannerText}>View Nearly Eligible Schemes (3)</Text>
          </View>
          <FontAwesome name="chevron-right" size={12} color="#EA580C" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// =========================================================================
// SCREEN 8: SCHEME DETAILS
// =========================================================================
export const SchemeDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { selectedSchemeId, getEvaluation, setStep } = useCheckStore();
  const summary = getEvaluation();
  const scheme =
    summary.eligibleSchemes.find((s) => s.id === selectedSchemeId) ||
    summary.eligibleSchemes[0];

  const [activeTab, setActiveTab] = useState<'overview' | 'eligibility' | 'documents'>('eligibility');

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Scheme Header */}
        <View style={styles.schemeDetailHeader}>
          <View style={styles.schemeDetailIconCircle}>
            <FontAwesome name="leaf" size={22} color="#047857" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.schemeDetailTitle}>{scheme.name}</Text>
            <Text style={styles.schemeDetailMinistry}>{scheme.ministry}</Text>
            <Text style={styles.schemeDetailBenefit}>
              {scheme.benefitAmount} • {scheme.benefitPeriod}
            </Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.schemeTabsRow}>
          {(['overview', 'eligibility', 'documents'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.schemeTab, isSelected && styles.schemeTabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.schemeTabText, isSelected && styles.schemeTabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Content: Eligibility */}
        {activeTab === 'eligibility' && (
          <View style={styles.tabContentCard}>
            <Text style={styles.tabSectionTitle}>Eligibility Criteria</Text>

            <View style={styles.criteriaChecklist}>
              {(scheme.criteriaList || [
                { text: 'Must be a small or marginal farmer', satisfied: true },
                { text: 'Age between 18-80 years', satisfied: true },
                { text: 'Valid land records in registered state', satisfied: true },
                { text: 'Not an income tax payer', satisfied: true },
              ]).map((c, idx) => (
                <View key={idx} style={styles.criteriaItem}>
                  <View style={styles.criteriaCheckBadge}>
                    <FontAwesome name="check" size={10} color="#047857" />
                  </View>
                  <Text style={styles.criteriaText}>{c.text}</Text>
                </View>
              ))}
            </View>

            {/* Personal Match Card */}
            <View style={styles.matchBadgeCard}>
              <FontAwesome name="check-circle" size={20} color="#047857" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.matchBadgeSubtitle}>Based on your profile:</Text>
                <Text style={styles.matchBadgeTitle}>You meet all eligibility criteria</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab Content: Overview */}
        {activeTab === 'overview' && (
          <View style={styles.tabContentCard}>
            <Text style={styles.tabSectionTitle}>Scheme Overview</Text>
            <Text style={styles.overviewParagraph}>
              Under the PM-KISAN scheme, all landholding farmer families will receive a financial
              benefit of ₹6,000 per year per family, payable in three equal installments of ₹2,000
              each, every four months directly into their bank accounts.
            </Text>
          </View>
        )}

        {/* Tab Content: Documents */}
        {activeTab === 'documents' && (
          <View style={styles.tabContentCard}>
            <Text style={styles.tabSectionTitle}>Required Documents</Text>
            <View style={styles.docRequirementItem}>
              <FontAwesome name="file-text-o" size={16} color="#047857" style={{ marginRight: 8 }} />
              <Text style={styles.docRequirementText}>Aadhaar Card (Verified in Vault)</Text>
            </View>
            <View style={styles.docRequirementItem}>
              <FontAwesome name="file-text-o" size={16} color="#047857" style={{ marginRight: 8 }} />
              <Text style={styles.docRequirementText}>Land Ownership Document (7/12 Extract)</Text>
            </View>
            <View style={styles.docRequirementItem}>
              <FontAwesome name="file-text-o" size={16} color="#047857" style={{ marginRight: 8 }} />
              <Text style={styles.docRequirementText}>Bank Account Passbook / Statement</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Actions: Apply Online + Ask in Chat */}
      <View style={styles.stickyFooterDual}>
        <TouchableOpacity
          style={styles.detailsApplyButton}
          onPress={() =>
            toastService.show(`Redirecting to portal for ${scheme.name}...`, 'info')
          }
        >
          <Text style={styles.detailsApplyText}>Apply Online</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.detailsChatButton}
          onPress={() => router.push('/(tabs)')}
        >
          <FontAwesome name="comment-o" size={14} color="#334155" style={{ marginRight: 6 }} />
          <Text style={styles.detailsChatText}>Ask in Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =========================================================================
// SCREEN 9: NEARLY ELIGIBLE
// =========================================================================
export const NearlyEligibleScreen: React.FC = () => {
  const router = useRouter();
  const { getEvaluation, setStep } = useCheckStore();
  const summary = getEvaluation();
  const nearlyList = summary.nearlyEligibleSchemes;

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Nearly Eligible ({nearlyList.length})</Text>
          <Text style={styles.formSubtitle}>
            Schemes where you are close to meeting the criteria
          </Text>
        </View>

        {nearlyList.map((scheme) => (
          <NearlyEligibleCard
            key={scheme.id}
            scheme={scheme}
            onLearnMore={(s) => {
              router.push({
                pathname: '/schemes/[id]',
                params: { id: s.id },
              });
            }}
          />
        ))}
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setStep('6_results_summary')}
          activeOpacity={0.85}
        >
          <FontAwesome name="arrow-left" size={14} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Back to Results</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =========================================================================
// STYLES
// =========================================================================
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  startHeroCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  citizensRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginVertical: spacing.sm,
  },
  citizenAvatar: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  citizenLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    marginTop: spacing.xs,
  },
  valuePropsList: {
    gap: spacing.sm + 2,
    marginTop: spacing.xs,
  },
  valuePropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  valuePropIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  valuePropText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  stickyFooterDual: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: '#065F46',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonHalf: {
    flex: 1,
    backgroundColor: '#065F46',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  formHeader: {
    marginBottom: spacing.md,
  },
  formStepTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: spacing.xs,
  },
  fieldLabelSub: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
  },
  textInput: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: '#0F172A',
  },
  inputRightIcon: {
    marginLeft: 6,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  genderPill: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderPillActive: {
    backgroundColor: '#065F46',
    borderColor: '#065F46',
  },
  genderIcon: {
    marginRight: 6,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  genderTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipSelect: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelectActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#047857',
  },
  chipSelectText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  chipSelectTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
  incomeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  incomeValueBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  incomeValueText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857',
  },
  incomePresetsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: '#065F46',
    borderColor: '#065F46',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  presetTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleRowContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: spacing.sm,
  },
  expandedSubCard: {
    marginTop: spacing.sm,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: spacing.sm,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  subCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  subCardInputLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  subCardInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    height: 38,
    paddingHorizontal: spacing.sm,
    fontSize: 13,
    color: '#0F172A',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  reviewCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  reviewIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: 6,
  },
  reviewText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  privacyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  privacyNoticeText: {
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
    flex: 1,
  },
  processingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  processingGlowOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  processingGlowInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  documentCardVisual: {
    width: 60,
    height: 75,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#047857',
    padding: 8,
    justifyContent: 'space-around',
  },
  docLine1: {
    width: '50%',
    height: 4,
    backgroundColor: '#6EE7B7',
    borderRadius: 2,
  },
  docLine2: {
    width: '100%',
    height: 4,
    backgroundColor: '#A7F3D0',
    borderRadius: 2,
  },
  docLine3: {
    width: '80%',
    height: 4,
    backgroundColor: '#A7F3D0',
    borderRadius: 2,
  },
  searchGlassIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  processingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  checklistContainer: {
    width: '100%',
    gap: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statusDotDone: {
    backgroundColor: '#047857',
  },
  checklistText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  processingTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  processingTipText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  skipProcessingButton: {
    marginTop: spacing.md,
    padding: spacing.xs,
  },
  skipProcessingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  celebrationBanner: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  celebrationCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  celebrationSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  celebrationCount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#065F46',
    marginTop: 2,
  },
  celebrationValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#064E3B',
    marginTop: 2,
  },
  celebrationHighlight: {
    color: '#047857',
    fontWeight: '900',
  },
  filterTabsRow: {
    gap: 8,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterTabPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabPillActive: {
    backgroundColor: '#065F46',
    borderColor: '#065F46',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeaderCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  nearlyEligibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  nearlyBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearlyBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
  },
  schemeDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  schemeDetailIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  schemeDetailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  schemeDetailMinistry: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  schemeDetailBenefit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
    marginTop: 4,
  },
  schemeTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  schemeTab: {
    paddingVertical: 10,
    marginRight: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  schemeTabActive: {
    borderBottomColor: '#047857',
  },
  schemeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  schemeTabTextActive: {
    color: '#047857',
    fontWeight: '800',
  },
  tabContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
  },
  tabSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: spacing.sm + 2,
  },
  criteriaChecklist: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criteriaCheckBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  criteriaText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  matchBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: spacing.sm + 2,
  },
  matchBadgeSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  matchBadgeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
    marginTop: 2,
  },
  overviewParagraph: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  docRequirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  docRequirementText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  detailsApplyButton: {
    flex: 2,
    backgroundColor: '#065F46',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsApplyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsChatButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsChatText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#047857',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: spacing.xs,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownIcon: {
    marginRight: 10,
  },
  dropdownValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickChipsContainer: {
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  quickChipsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  moreStatesChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreStatesChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  customDistrictContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  customDistrictInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  customDistrictApplyBtn: {
    backgroundColor: '#047857',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  customDistrictApplyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  customDistrictToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 4,
  },
  customDistrictToggleText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginBottom: spacing.md,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 4,
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemRowSelected: {
    backgroundColor: '#ECFDF5',
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  modalItemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  modalItemTextSelected: {
    color: '#047857',
    fontWeight: '700',
  },
  modalFooterInput: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: spacing.sm,
  },
  modalFooterLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
  },
  customIncomeBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customIncomeLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  customIncomeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
  },
  rupeePrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: '#047857',
    marginRight: 6,
  },
  customIncomeInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 10,
  },
});
