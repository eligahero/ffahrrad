import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const previousFilePath = path.join(process.cwd(), 'exports', 'copilot-sample-10-products-seo.json');
  let excludedIds = [];

  if (fs.existsSync(previousFilePath)) {
    const prevData = JSON.parse(fs.readFileSync(previousFilePath, 'utf8'));
    excludedIds = prevData.products.map((p) => p.id);
    console.log(`Exclusion des ${excludedIds.length} produits du lot précédent.`);
  }

  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      id: { notIn: excludedIds },
    },
    take: 100,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      gtin: true,
      discountLabel: true,
      type: true,
      shortDescription: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
      attributes: true,
      variations: true,
      images: true,
      brand: {
        select: {
          name: true,
          slug: true,
        },
      },
      categories: {
        select: {
          name: true,
          slug: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log(`Nombre de produits extraits : ${products.length}`);

  const payload = {
    exportedAt: new Date().toISOString(),
    batch: 2,
    totalProducts: products.length,
    scope: 'read-only:100-active-products-batch-2',
    securityGuarantee: 'Zero customer accounts, zero orders, zero reviews, zero credentials.',
    products: products,
  };

  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const batch2Path = path.join(exportDir, 'copilot-batch-2-100-products.json');
  fs.writeFileSync(batch2Path, JSON.stringify(payload, null, 2), 'utf8');

  // Met à jour également le fichier principal à la racine pour Copilot
  const rootPath = path.join(process.cwd(), 'copilot-sample-products.json');
  fs.writeFileSync(rootPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`✅ Fichier généré : ${batch2Path}`);
  console.log(`✅ Fichier racine synchronisé : ${rootPath}`);
}

run()
  .catch((e) => {
    console.error('Erreur export :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
