import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const excludedIds = new Set();

  const filesToCheck = [
    'copilot-sample-10-products-seo.json',
    'copilot-batch-2-100-products-seo.json',
    'copilot-sample-10-products.json',
    'copilot-batch-2-100-products.json',
  ];

  for (const fileName of filesToCheck) {
    const filePath = path.join(process.cwd(), 'exports', fileName);
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.products && Array.isArray(data.products)) {
          data.products.forEach((p) => excludedIds.add(p.id));
        }
      } catch (e) {
        console.warn(`Erreur lors de la lecture de ${fileName}:`, e.message);
      }
    }
  }

  console.log(`Nombre d'IDs déjà optimisés à exclure : ${excludedIds.size}`);

  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const countToFetch = limitArg ? parseInt(limitArg.split('=')[1], 10) : 150;

  console.log(`Extraction de ${countToFetch} nouveaux produits...`);

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

  console.log(`Nombre de produits extraits pour le lot 3 : ${products.length}`);

  const payload = {
    exportedAt: new Date().toISOString(),
    batch: 3,
    totalProducts: products.length,
    scope: `read-only:${products.length}-active-products-batch-3`,
    securityGuarantee: 'Zero customer accounts, zero orders, zero reviews, zero credentials.',
    products: products,
  };

  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const batch3File = `copilot-batch-3-${products.length}-products.json`;
  const batch3Path = path.join(exportDir, batch3File);
  fs.writeFileSync(batch3Path, JSON.stringify(payload, null, 2), 'utf8');

  // Met également à jour le fichier racine pour que le lien GitHub reste identique
  const rootPath = path.join(process.cwd(), 'copilot-sample-products.json');
  fs.writeFileSync(rootPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`✅ Fichier généré : ${batch3Path}`);
  console.log(`✅ Fichier racine mis à jour : ${rootPath}`);
}

run()
  .catch((e) => {
    console.error('Erreur export lot 3 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
