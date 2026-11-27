import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const excludedIds = new Set();
  const allExportFiles = fs.readdirSync(exportDir).filter((f) => f.endsWith('.json'));

  let maxBatch = 3;
  for (const fileName of allExportFiles) {
    const filePath = path.join(exportDir, fileName);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (data.products && Array.isArray(data.products)) {
        data.products.forEach((p) => {
          if (p && p.id) excludedIds.add(p.id);
        });
      }
      if (data.batch && typeof data.batch === 'number') {
        if (data.batch > maxBatch) maxBatch = data.batch;
      }
    } catch (e) {
      console.warn(`Avertissement : impossible de parser ${fileName} :`, e.message);
    }
  }

  console.log(`========================================================`);
  console.log(`PRÉPARATION D'UN NOUVEAU LOT DE PRODUITS`);
  console.log(`========================================================`);
  console.log(`Nombre total d'IDs déjà traités/exportés à exclure : ${excludedIds.size}`);

  const batchArg = process.argv.find((a) => a.startsWith('--batch='));
  const nextBatch = batchArg ? parseInt(batchArg.split('=')[1], 10) : maxBatch + 1;

  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const countToFetch = limitArg ? parseInt(limitArg.split('=')[1], 10) : 150;

  console.log(`Lot cible : Lot ${nextBatch}`);
  console.log(`Nombre demandé : ${countToFetch} produits`);

  const totalActiveInDb = await prisma.product.count({
    where: { isDeleted: false },
  });

  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      id: { notIn: Array.from(excludedIds) },
    },
    take: countToFetch,
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

  console.log(`Nombre de nouveaux produits extraits : ${products.length}`);
  const remaining = totalActiveInDb - excludedIds.size - products.length;
  console.log(`Total catalogue actif : ${totalActiveInDb}`);
  console.log(`Produits restants à traiter après ce lot : ${Math.max(0, remaining)}`);

  const payload = {
    exportedAt: new Date().toISOString(),
    batch: nextBatch,
    totalProducts: products.length,
    scope: `read-only:${products.length}-active-products-batch-${nextBatch}`,
    securityGuarantee: 'Zero customer accounts, zero orders, zero reviews, zero credentials.',
    products: products,
  };

  const batchFile = `copilot-batch-${nextBatch}-${products.length}-products.json`;
  const batchPath = path.join(exportDir, batchFile);
  fs.writeFileSync(batchPath, JSON.stringify(payload, null, 2), 'utf8');

  // Met à jour la cible unique accessible à Copilot
  const rootPath = path.join(process.cwd(), 'copilot-sample-products.json');
  fs.writeFileSync(rootPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`✅ Fichier archivé créé : ${batchPath}`);
  console.log(`✅ Fichier racine mis à jour pour Copilot : ${rootPath}`);
  console.log(`========================================================`);
}

run()
  .catch((e) => {
    console.error('Erreur export :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
