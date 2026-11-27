import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Exporting read-only product data for Copilot...');

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      gtin: true,
      discountLabel: true,
      images: true,
      shortDescription: true,
      description: true,
      attributes: true,
      variations: true,
      createdAt: true,
      updatedAt: true,
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      categories: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const exportPath = path.join(exportDir, 'copilot-products-readonly.json');
  fs.writeFileSync(
    exportPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalProducts: products.length,
        scope: 'read-only:products-only',
        disclaimer: 'This file contains ONLY product catalog data. Orders, customer accounts, reviews, and credentials are completely excluded.',
        products,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`✅ Successfully exported ${products.length} products to: ${exportPath}`);
}

main()
  .catch((e) => {
    console.error('Export error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
