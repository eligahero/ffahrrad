import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const isApply = process.argv.includes('--apply');

// Permet de passer un fichier custom : --file=exports/mon-fichier.json
const fileArg = process.argv.find((arg) => arg.startsWith('--file='));
const defaultPath = path.join(process.cwd(), 'copilot-sample-products.json');
const jsonPath = fileArg ? path.resolve(process.cwd(), fileArg.split('=')[1]) : defaultPath;

if (!fs.existsSync(jsonPath)) {
  console.error(`Fichier introuvable : ${jsonPath}`);
  process.exit(1);
}

const fileData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const products = fileData.products;

console.log(`\n========================================================`);
console.log(`IMPORT DES OPTIMISATIONS SEO COPILOT`);
console.log(`Fichier source : ${path.basename(jsonPath)} (${products.length} produits)`);
console.log(`Mode           : ${isApply ? '🚀 APPLICATION RÉELLE EN BASE' : '🔍 SIMULATION (DRY RUN)'}`);
console.log(`========================================================\n`);

const prisma = new PrismaClient();

async function main() {
  let updatedCount = 0;

  for (const item of products) {
    const existing = await prisma.product.findUnique({
      where: { id: item.id },
      select: {
        id: true,
        title: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
      },
    });

    if (!existing) {
      console.warn(`⚠️ Produit introuvable en base : ${item.slug} (${item.id})`);
      continue;
    }

    console.log(`📦 Produit : "${existing.title}" (${existing.slug})`);
    console.log(`   - Ancien metaTitle       : ${existing.metaTitle || '(vide)'}`);
    console.log(`   + NOUVEAU metaTitle      : ${item.metaTitle}`);
    console.log(`   - Ancien metaDescription : ${existing.metaDescription ? existing.metaDescription.slice(0, 70) + '...' : '(vide)'}`);
    console.log(`   + NOUVELLE metaDesc      : ${item.metaDescription}`);
    console.log(`   + Description HTML       : ${item.description ? item.description.length + ' caractères' : '(vide)'}`);

    if (isApply) {
      await prisma.product.update({
        where: { id: item.id },
        data: {
          metaTitle: item.metaTitle,
          metaDescription: item.metaDescription,
          description: item.description,
        },
      });
      console.log(`   ✅ Appliqué en base avec succès.\n`);
    } else {
      console.log(`   ℹ️ [DRY-RUN] Prêt à appliquer (non écrit en base).\n`);
    }

    updatedCount++;
  }

  console.log(`========================================================`);
  console.log(`Résultat : ${updatedCount}/${products.length} produits ${isApply ? 'mis à jour en base' : 'analysés avec succès'}.`);
  if (!isApply) {
    console.log(`Pour appliquer ces changements dans PostgreSQL, relancez avec :`);
    console.log(`node scripts/apply-copilot-seo.mjs --apply`);
  }
  console.log(`========================================================\n`);
}

main()
  .catch((e) => {
    console.error('Erreur :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
