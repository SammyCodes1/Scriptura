import { ENV } from '../src/config/env';
import { getActiveTranslations, getTranslationInfo, markLicensePurchased } from '../src/config/translations';

console.log('=' .repeat(60));
console.log('COMMERCIAL FLAG & TRANSLATION RULES VERIFICATION');
console.log('=' .repeat(60));

// Test Case 1: Non-commercial default
console.log('\n--- Case 1: IS_COMMERCIAL = false ---');
ENV.IS_COMMERCIAL = false;
let list = getActiveTranslations();
const hasNivNonCommercial = list.some(t => t.id === 'NIV');
console.log(`NIV included when IS_COMMERCIAL=false: ${hasNivNonCommercial}`);
if (!hasNivNonCommercial) throw new Error('NIV should be present in non-commercial mode');

const esvNonCommercial = list.find(t => t.id === 'ESV');
console.log(`ESV requiresLicense when IS_COMMERCIAL=false: ${esvNonCommercial?.requiresLicense}`);
if (esvNonCommercial?.requiresLicense !== false) throw new Error('ESV should not require license in non-commercial mode');

// Test Case 2: Commercial mode
console.log('\n--- Case 2: IS_COMMERCIAL = true ---');
ENV.IS_COMMERCIAL = true;
list = getActiveTranslations();
const hasNivCommercial = list.some(t => t.id === 'NIV');
console.log(`NIV included when IS_COMMERCIAL=true: ${hasNivCommercial}`);
if (hasNivCommercial) throw new Error('NIV must be completely excluded in commercial mode (no commercial license available)');

const nivInfo = getTranslationInfo('NIV');
console.log(`NIV translation info flagged excludedCommercial: ${nivInfo?.excludedCommercial}`);
if (!nivInfo?.excludedCommercial) throw new Error('NIV info must flag excludedCommercial=true');

const esvCommercial = list.find(t => t.id === 'ESV');
console.log(`ESV requiresLicense initially in commercial mode: ${esvCommercial?.requiresLicense}`);
if (!esvCommercial?.requiresLicense) throw new Error('ESV should require license in commercial mode before confirmation');

// Test Case 3: Commercial mode with confirmed license purchase
console.log('\n--- Case 3: Commercial mode after confirming purchased license ---');
markLicensePurchased('ESV');
list = getActiveTranslations();
const esvLicensed = list.find(t => t.id === 'ESV');
console.log(`ESV requiresLicense after markLicensePurchased: ${esvLicensed?.requiresLicense}`);
if (esvLicensed?.requiresLicense) throw new Error('ESV requiresLicense should be false after license purchase');

console.log('\n' + '='.repeat(60));
console.log('ALL COMMERCIAL RULE TESTS PASSED!');
console.log('=' .repeat(60));
