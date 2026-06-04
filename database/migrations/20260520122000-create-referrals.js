'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('referrals', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            referrer_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE'
            },
            referred_user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE'
            },
            code_used: {
                type: Sequelize.STRING(40),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('pending', 'rewarded', 'revoked'),
                allowNull: false,
                defaultValue: 'pending'
            },
            reward_days: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            rewarded_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            revoked_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            revoked_reason: {
                type: Sequelize.STRING(255),
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

        await queryInterface.addIndex('referrals', ['referrer_id'], { name: 'referrals_referrer_id_idx' }).catch(() => null);
        await queryInterface.addIndex('referrals', ['status'], { name: 'referrals_status_idx' }).catch(() => null);
        await queryInterface.addIndex('referrals', ['rewarded_at'], { name: 'referrals_rewarded_at_idx' }).catch(() => null);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('referrals');
        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_referrals_status";'
        ).catch(() => null);
    }
};
