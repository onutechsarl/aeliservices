'use strict';

const DEFAULT_SETTINGS = [
    {
        key: 'referral.rewardDays',
        value: '7',
        defaultValue: '7',
        valueType: 'int',
        description: "Jours d'abonnement offerts au parrain par parrainage validé",
        minValue: '1',
        maxValue: '365'
    },
    {
        key: 'referral.monthlyCap',
        value: '20',
        defaultValue: '20',
        valueType: 'int',
        description: 'Nombre maximum de parrainages récompensés par parrain et par mois',
        minValue: '1',
        maxValue: '1000'
    },
    {
        key: 'referral.rollbackWindowDays',
        value: '30',
        defaultValue: '30',
        valueType: 'int',
        description: 'Fenêtre (jours) pour annuler un bonus si le filleul ferme/désactive son compte',
        minValue: '0',
        maxValue: '365'
    },
    {
        key: 'referral.requireEmailVerified',
        value: 'true',
        defaultValue: 'true',
        valueType: 'bool',
        description: 'Déclenche le bonus uniquement après vérification OTP (sinon dès inscription)',
        minValue: null,
        maxValue: null
    },
    {
        key: 'referral.codeLength',
        value: '6',
        defaultValue: '6',
        valueType: 'int',
        description: 'Longueur du suffixe aléatoire dans les codes générés (ex. AELI-XXXXXX)',
        minValue: '4',
        maxValue: '12'
    },
    {
        key: 'adminGrant.maxDays',
        value: '365',
        defaultValue: '365',
        valueType: 'int',
        description: 'Nombre maximum de jours qu\'un administrateur peut offrir en un seul grant',
        minValue: '1',
        maxValue: '3650'
    }
];

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('platform_settings', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            key: {
                type: Sequelize.STRING(120),
                allowNull: false,
                unique: true
            },
            value: {
                type: Sequelize.STRING(500),
                allowNull: false
            },
            value_type: {
                type: Sequelize.ENUM('int', 'float', 'bool', 'string', 'json'),
                allowNull: false
            },
            default_value: {
                type: Sequelize.STRING(500),
                allowNull: false
            },
            description: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            min_value: {
                type: Sequelize.STRING(120),
                allowNull: true
            },
            max_value: {
                type: Sequelize.STRING(120),
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('NOW')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('NOW')
            }
        });

        await queryInterface.addIndex('platform_settings', ['key'], {
            unique: true,
            name: 'platform_settings_key_unique'
        }).catch(() => null);

        // Seed defaults — idempotent on key conflicts
        const now = new Date();
        const { randomUUID } = require('crypto');
        const rows = DEFAULT_SETTINGS.map((s) => ({
            id: randomUUID(),
            ...s,
            created_at: now,
            updated_at: now
        }));
        await queryInterface.bulkInsert('platform_settings', rows, {
            ignoreDuplicates: true
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('platform_settings');
        // Drop the ENUM type explicitly under Postgres
        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_platform_settings_value_type";'
        ).catch(() => null);
    }
};
