import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    take: 10,
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

  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const exportPath = path.join(exportDir, 'copilot-sample-10-products.json');
  fs.writeFileSync(
    exportPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalProducts: products.length,
        scope: 'read-only:10-active-products-sample',
        securityGuarantee: 'Zero customer accounts, zero orders, zero reviews, zero credentials.',
        products,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`SUCCESS_EXPORTED_${products.length}_PRODUCTS`);
}

run()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
