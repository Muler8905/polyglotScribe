import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultPlans = [
  {
    slug: "starter",
    name: "Starter",
    description: "Good for light use",
    priceEtb: 299,
    credits: 100,
    highlight: false,
    sortOrder: 1,
    active: true,
  },
  {
    slug: "pro",
    name: "Pro",
    description: "Best value for teams",
    priceEtb: 999,
    credits: 400,
    highlight: true,
    sortOrder: 2,
    active: true,
  },
  {
    slug: "business",
    name: "Business",
    description: "High-volume power users",
    priceEtb: 2499,
    credits: 1200,
    highlight: false,
    sortOrder: 3,
    active: true,
  },
];

async function main() {
  for (const plan of defaultPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    throw e;
  });

