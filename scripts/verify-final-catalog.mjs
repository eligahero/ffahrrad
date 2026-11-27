import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const total = await prisma.product.count({ where: { isDeleted: false } });
  const withMetaTitle = await prisma.product.count({ where: { isDeleted: false, metaTitle: { not: null } } });
  const withMetaDesc = await prisma.product.count({ where: { isDeleted: false, metaDescription: { not: null } } });

  console.log('================================================');
  console.log('🎉 BILAN GLOBAL BASE DE DONNÉES POSTGRESQL');
  console.log('================================================');
  console.log(`Total fiches actives en base     : ${total}`);
  console.log(`Fiches avec metaTitle renseigné  : ${withMetaTitle}`);
  console.log(`Fiches avec metaDesc renseigné   : ${withMetaDesc}`);
  console.log(`Taux de couverture SEO           : ${((withMetaDesc / total) * 100).toFixed(2)}%`);
  console.log('================================================');
}

check()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
