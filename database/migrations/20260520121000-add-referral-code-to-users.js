'use strict';

const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const randomSuffix = (length = 6) => {
    const bytes = crypto.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) {
        out += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return out;
};

module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('users');
        if (!table.referral_code) {
            await queryInterface.addColumn('users', 'referral_code', {
                type: Sequelize.STRING(40),
                allowNull: true,
                unique: false
            });
        }

        // Backfill missing codes
        const [rows] = await queryInterface.sequelize.query(
            "SELECT id FROM users WHERE referral_code IS NULL OR referral_code = ''"
        );
        const seen = new Set();
        const [existing] = await queryInterface.sequelize.query(
            "SELECT referral_code FROM users WHERE referral_code IS NOT NULL AND referral_code <> ''"
        );
        existing.forEach((r) => seen.add(r.referral_code));

        for (const row of rows) {
            let candidate;
            do {
                candidate = `AELI-${randomSuffix(6)}`;
            } while (seen.has(candidate));
            seen.add(candidate);
            await queryInterface.sequelize.query(
                'UPDATE users SET referral_code = :code WHERE id = :id',
                { replacements: { code: candidate, id: row.id } }
            );
        }

        await queryInterface.addIndex('users', ['referral_code'], {
            unique: true,
            name: 'users_referral_code_unique'
        }).catch(() => null);
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('users', 'users_referral_code_unique').catch(() => null);
        const table = await queryInterface.describeTable('users');
        if (table.referral_code) {
            await queryInterface.removeColumn('users', 'referral_code');
        }
    }
};
