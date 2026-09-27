const { body } = require('express-validator');

/**
 * Validation rules for user registration
 */
/**
 * Normalize a phone number to an international-ish format:
 * strip spaces/dashes/dots/parentheses, map a leading "00" to "+", and
 * default a bare 9-digit Cameroon number to +237. Best-effort only — the
 * field stays optional and we never reject on format.
 */
const normalizePhone = (value) => {
    if (!value) return value;
    let v = String(value).trim().replace(/[\s.\-()]/g, '');
    if (v.startsWith('00')) v = `+${v.slice(2)}`;
    if (/^237\d{8,9}$/.test(v)) v = `+${v}`;
    else if (/^6\d{8}$/.test(v)) v = `+237${v}`; // local Cameroon mobile
    return v;
};

// Registration is intentionally light: only email, password and firstName are
// required. Password confirmation is enforced on the frontend only.
const registerValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Veuillez fournir un email valide')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères'),

    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('Le prénom est requis')
        .isLength({ min: 1, max: 100 })
        .withMessage('Le prénom ne peut pas dépasser 100 caractères'),

    body('lastName')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('Le nom ne peut pas dépasser 100 caractères'),

    body('phone')
        .optional({ checkFalsy: true })
        .customSanitizer(normalizePhone)
        .isLength({ min: 6, max: 20 })
        .withMessage('Numéro de téléphone invalide'),

    body('country')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom du pays doit contenir entre 2 et 100 caractères'),

    body('gender')
        .optional({ checkFalsy: true })
        .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
        .withMessage('Genre invalide'),

    body('referralCode')
        .optional({ checkFalsy: true })
        .trim()
        .isString()
        .isLength({ max: 40 })
        .withMessage('Code de parrainage invalide')
];

/**
 * Validation rules for user login
 */
const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Veuillez fournir un email valide')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Le mot de passe est requis')
];

/**
 * Validation rules for forgot password
 */
const forgotPasswordValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Veuillez fournir un email valide')
        .normalizeEmail()
];

/**
 * Validation rules for reset password
 */
const resetPasswordValidation = [
    body('password')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
];

/**
 * Validation rules for password change
 */
const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Le mot de passe actuel est requis'),

    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
];

module.exports = {
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    changePasswordValidation
};
