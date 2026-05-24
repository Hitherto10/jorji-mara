// src/utils/shippingCalculator.js
import shippingData from '../data/shipping.json';

// ─── Nigeria domestic flat fees ───────────────────────────────────────────────
const NIGERIA_ABUJA_FEE  = 5000;
const NIGERIA_OTHER_FEE  = 8000;

// ─── Fallback weight per item when products.weight is null ───────────────────
const DEFAULT_WEIGHT_KG  = 0.5;

/**
 * Rounds a weight value UP to the nearest 0.5 kg bracket.
 * e.g. 1.1 → 1.5, 2.0 → 2.0, 2.6 → 3.0
 */
function roundUpToHalf(weight) {
    return Math.ceil(weight * 2) / 2;
}

/**
 * Determines whether a Nigerian state string corresponds to FCT / Abuja.
 * @param {string} state
 * @returns {boolean}
 */
function isAbujaState(state) {
    const s = (state ?? '').toLowerCase();
    return s.includes('abuja') || s.includes('fct');
}

/**
 * Calculates the shipping fee for a given destination and cart.
 *
 * Nigeria (countryCode === 'NG'):
 *   - No weight calculation. Returns flat ₦5,000 (Abuja) or ₦8,000 (other states).
 *
 * International:
 *   - Sums up (product.weight * quantity) for each item.
 *   - Falls back to DEFAULT_WEIGHT_KG per item if weight is null.
 *   - Rounds total weight up to the nearest 0.5 kg bracket.
 *   - Looks up the zone from shipping.json → countries[countryCode].
 *   - Looks up the rate from shipping.json → rates[zone][bracket].
 *   - For weights above 30 kg: base 30 kg rate + (extraKg * aboveThirtyRatePerKg[zone]).
 *
 * @param {object}  opts
 * @param {Array<{variantId: string, quantity: number}>}  opts.items
 * @param {string}  opts.countryCode  - ISO 2-letter code (e.g. "GB", "US", "NG")
 * @param {string}  [opts.stateRegion] - free-text region; used only for Nigeria Abuja detection
 * @param {Array}   opts.variants     - product_variant DB rows with nested products.weight
 *
 * @returns {{ shippingFee: number, zone: number|null, weightKg: number|null, currency: string }}
 * @throws {Error} if countryCode is not found in shipping.json
 */
export function calculateShipping({ items, countryCode, stateRegion = '', variants = [] }) {

    // ── Nigeria domestic ─────────────────────────────────────────────────────
    if (countryCode === 'NG') {
        return {
            shippingFee: isAbujaState(stateRegion) ? NIGERIA_ABUJA_FEE : NIGERIA_OTHER_FEE,
            zone:        null,
            weightKg:    null,
            currency:    'NGN',
        };
    }

    // ── International ────────────────────────────────────────────────────────
    const countryEntry = shippingData.countries[countryCode];
    if (!countryEntry) {
        throw new Error(`Country "${countryCode}" is not in our shipping coverage.`);
    }
    const zone = countryEntry.zone;

    // Calculate total cart weight
    let totalWeight = 0;
    for (const item of items) {
        const variant = variants.find(v => v.id === item.variantId);
        const weight  = Number(variant?.products?.weight ?? DEFAULT_WEIGHT_KG);
        totalWeight  += weight * item.quantity;
    }
    if (totalWeight <= 0) totalWeight = DEFAULT_WEIGHT_KG;

    // Round up to nearest 0.5 kg bracket (minimum 0.5)
    const bracket   = roundUpToHalf(Math.max(totalWeight, 0.5));
    const zoneRates = shippingData.rates[String(zone)];
    if (!zoneRates) {
        throw new Error(`No rate table for zone ${zone}.`);
    }

    let shippingFee;
    if (bracket <= 30) {
        shippingFee = zoneRates[String(bracket)];

        // Safety: find the next available bracket if exact key is missing
        if (shippingFee === undefined) {
            const available = Object.keys(zoneRates).map(Number).sort((a, b) => a - b);
            const next      = available.find(b => b >= bracket) ?? available[available.length - 1];
            shippingFee     = zoneRates[String(next)];
        }
    } else {
        // Above 30 kg: 30 kg base rate + per-kg surcharge for extra weight
        const base30  = zoneRates['30'];
        const extraKg = bracket - 30;
        const perKg   = shippingData.aboveThirtyRatePerKg[String(zone)];
        shippingFee   = base30 + extraKg * perKg;
    }

    return {
        shippingFee: Math.round(shippingFee * 100) / 100,
        zone,
        weightKg:   Math.round(totalWeight * 1000) / 1000,
        currency:   'NGN',
    };
}
