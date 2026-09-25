/**
 * Safe subquery builders for provider listing filters.
 *
 * `getProviders` and `getAllProvidersAdmin` both need to filter providers on
 * columns that live in `services`. Sequelize cannot express that as a plain
 * `where`, so the original code built the sub-SELECTs by string interpolation
 * of raw query parameters — which made `search`, `category` and `categoryId`
 * injectable on a public, unauthenticated route.
 *
 * Every value that reaches SQL here goes through `sequelize.escape()` (string
 * literals) or `Number()` (numeric literals). Nothing is concatenated raw.
 */

const { literal } = require('sequelize');
const { sequelize } = require('../config/database');
const { UUID_RE } = require('../middlewares/validateParams');

/** Longest accepted free-text search. Keeps the ILIKE scan bounded. */
const MAX_SEARCH_LENGTH = 100;

/** A category slug as produced by `slugify`: lowercase, digits and dashes. */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Build the `%term%` pattern for an ILIKE search, trimmed and length-bounded.
 * Returns null when the term is unusable, so the caller can skip the filter.
 */
const buildSearchPattern = (search) => {
    if (typeof search !== 'string') return null;
    const trimmed = search.trim();
    if (!trimmed) return null;
    return `%${trimmed.slice(0, MAX_SEARCH_LENGTH)}%`;
};

/** Providers having at least one service whose name or description matches. */
const providerIdsMatchingServiceText = (pattern) => {
    const safe = sequelize.escape(pattern);
    return literal(
        `(SELECT DISTINCT provider_id FROM services WHERE name ILIKE ${safe} OR description ILIKE ${safe})`
    );
};

/** Providers having at least one active service inside the price range. */
const providerIdsInPriceRange = (minPrice, maxPrice) => {
    // parseFloat mirrors the original behaviour; the result is coerced to a
    // finite Number before it reaches SQL, so no raw text is ever injected.
    const parsedMin = parseFloat(minPrice);
    const parsedMax = parseFloat(maxPrice);
    const min = Number.isFinite(parsedMin) ? parsedMin : 0;
    const max = Number.isFinite(parsedMax) ? parsedMax : 999999999;
    return literal(
        `(SELECT DISTINCT provider_id FROM services WHERE price >= ${min} AND price <= ${max} AND is_active = true)`
    );
};

/** Providers having at least one service in the given category (by UUID). */
const providerIdsForCategoryId = (categoryId) => {
    const safe = sequelize.escape(categoryId);
    return literal(
        `(SELECT DISTINCT provider_id FROM services WHERE category_id = ${safe})`
    );
};

/** Providers having at least one service in the given category (by slug). */
const providerIdsForCategorySlug = (slug) => {
    const safe = sequelize.escape(slug);
    return literal(
        `(SELECT DISTINCT provider_id FROM services WHERE category_id = (SELECT id FROM categories WHERE slug = ${safe}))`
    );
};

/**
 * Validate the category filter before it reaches SQL.
 *
 * `categoryId` must be a UUID (otherwise Postgres raises "invalid input
 * syntax for type uuid" and we bubble a 500 on a user typo) and `category`
 * must look like a slug.
 *
 * Returns { ok: true, subquery } | { ok: false, param } | { ok: true }
 * when no category filter was requested.
 */
const buildCategoryFilter = ({ categoryId, category }) => {
    if (categoryId) {
        if (typeof categoryId !== 'string' || !UUID_RE.test(categoryId)) {
            return { ok: false, param: 'categoryId' };
        }
        return { ok: true, subquery: providerIdsForCategoryId(categoryId) };
    }

    if (category) {
        if (typeof category !== 'string' || !SLUG_RE.test(category)) {
            return { ok: false, param: 'category' };
        }
        return { ok: true, subquery: providerIdsForCategorySlug(category) };
    }

    return { ok: true };
};

module.exports = {
    MAX_SEARCH_LENGTH,
    SLUG_RE,
    buildSearchPattern,
    providerIdsMatchingServiceText,
    providerIdsInPriceRange,
    providerIdsForCategoryId,
    providerIdsForCategorySlug,
    buildCategoryFilter
};
