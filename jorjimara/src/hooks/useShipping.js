// src/hooks/useShipping.js
//
// Exports constants and a utility function used by the Checkout shipping step.
// Keeps the shipping JSON logic out of the component body.

import shippingData from '../data/shipping.json';

// ─── Country list ──────────────────────────────────────────────────────────────
// Build a sorted array from shipping.json → countries, ready for <select> options.
// Nigeria is the shipping origin so it is absent from the DHL rate table.
// We inject it manually so it still appears in the dropdown (handled as a
// flat-fee domestic route rather than a zone-based international one).
export const SHIPPING_COUNTRIES = [
    { value: 'NG', label: 'Nigeria' },
    ...Object.entries(shippingData.countries)
        .map(([code, { name }]) => ({ value: code, label: name })),
].sort((a, b) => a.label.localeCompare(b.label));

// ─── Nigerian states ───────────────────────────────────────────────────────────
// Used when country === 'NG': the state selection determines the flat domestic fee.
export const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja',
    'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
    'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
    'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
].map(s => ({ value: s, label: s }));

// ─── Nigeria fee helper ────────────────────────────────────────────────────────
/**
 * Returns the flat domestic fee for Nigeria based on state.
 * ₦5,000 for FCT / Abuja; ₦8,000 for any other state.
 * Returns null when no state is selected yet.
 *
 * @param {string} state
 * @returns {number|null}
 */
export function getNigeriaFee(state) {
    if (!state) return null;
    const s = state.toLowerCase();
    return (s.includes('abuja') || s.includes('fct')) ? 5000 : 8000;
}
