'use strict';

const slugify = require('slugify');

const slugifyOptions = { lower: true, strict: true, locale: 'fr', trim: true };

module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('providers');
        if (!table.slug) {
            await queryInterface.addColumn('providers', 'slug', {
                type: Sequelize.STRING(280),
                allowNull: true,
                unique: false
            });
        }

        const [rows] = await queryInterface.sequelize.query(
            'SELECT id, business_name FROM providers WHERE slug IS NULL OR slug = \'\''
        );

        const seen = new Set();
        const [existing] = await queryInterface.sequelize.query(
            'SELECT slug FROM providers WHERE slug IS NOT NULL AND slug <> \'\''
        );
        existing.forEach((row) => seen.add(row.slug));

        for (const row of rows) {
            const base = slugify(row.business_name || 'prestataire', slugifyOptions) || 'prestataire';
            let candidate = base;
            let suffix = 2;
            while (seen.has(candidate)) {
                candidate = `${base}-${suffix}`;
                suffix += 1;
            }
            seen.add(candidate);
            await queryInterface.sequelize.query(
                'UPDATE providers SET slug = :slug WHERE id = :id',
                { replacements: { slug: candidate, id: row.id } }
            );
        }

        await queryInterface.addIndex('providers', ['slug'], {
            unique: true,
            name: 'providers_slug_unique'
        }).catch(() => null);
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('providers', 'providers_slug_unique').catch(() => null);
        const table = await queryInterface.describeTable('providers');
        if (table.slug) {
            await queryInterface.removeColumn('providers', 'slug');
        }
    }
};
