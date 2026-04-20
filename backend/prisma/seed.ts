import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@traineros.com' },
    update: {},
    create: {
      email: 'demo@traineros.com',
      passwordHash,
      name: 'Demo User',
      plan: 'PRO',
      niche: 'Fitness postnatal — slăbit sănătos pentru mame (0-2 ani)',
      icpProfile: 'Mamă 28-38 ani, post-sarcină, vrea să slăbească fără diete extreme, dispusă să investească în coaching 1:1',
      positioningMessage: 'Ajut mamele să revină la greutatea ideală fără restricții extreme — cu un plan personalizat de 12 săptămâni.',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create multiple sample ideas with variety
  const sampleIdeas = [
    {
      format: 'REEL',
      hook: '3 greșeli care te țin pe loc — chiar dacă mănânci curat',
      script: [
        { scene: 1, text: '95% din clienții mei făceau asta greșit', visual: 'Hook vizual: te filmezi arătând o farfurie "sănătoasă"' },
        { scene: 2, text: 'Nu contează ce mănânci dacă nu faci ASTA', visual: 'Text overlay cu greutatea ideală' },
        { scene: 3, text: 'Scrie PLAN în DM', visual: 'CTA vizual' },
      ],
      cta: 'Scrie PLAN în DM și primești ghidul gratuit de 7 zile',
      objective: 'Generare lead-uri',
      conversionRate: 47.5,
      leadMagnet: 'Plan gratuit de 7 zile',
      dmKeyword: 'PLAN',
      reasoning: 'Hook-ul specifică o problemă concretă. Promisiunea este clară. CTA-ul este acționabil.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      format: 'CAROUSEL',
      hook: 'De ce nu slăbești deși ești în deficit caloric?',
      script: [
        { scene: 1, text: 'Slide 1: Poți fi în deficit dar să nu slăbești', visual: 'Grafic cu deficit caloric' },
        { scene: 2, text: 'Slide 2: Metabolism adaptat = plateau', visual: 'Explicație metabolizm' },
        { scene: 3, text: 'Slide 3: Soluția? Diet breaks strategice', visual: 'Calendar cu diet breaks' },
      ],
      cta: 'Comentează GHID pentru strategia completă',
      objective: 'Engagement',
      conversionRate: 38.2,
      leadMagnet: 'Ghid diet breaks',
      dmKeyword: 'GHID',
      reasoning: 'Adresează o frustrare comună. Oferă o soluție neobvioasă. Engagement prin comentarii.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      format: 'REEL',
      hook: 'Am pierdut 15kg fără să renunț la pâine',
      script: [
        { scene: 1, text: 'Toată lumea îmi spunea: renunță la pâine!', visual: 'Pâine pe masă' },
        { scene: 2, text: 'Dar problema nu e pâinea...', visual: 'Revelație: porțiile + frecvența' },
        { scene: 3, text: 'E cum o integrezi în planul tău', visual: 'Before/after rezultat' },
      ],
      cta: 'Salvează postarea și scrie START în DM',
      objective: 'Generare lead-uri',
      conversionRate: 52.1,
      leadMagnet: 'Plan personalizat',
      dmKeyword: 'START',
      reasoning: 'Social proof puternic. Distruge mit comun. Rezultat vizibil credibilizează.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      format: 'STORY',
      hook: 'POV: Ai slabit 10kg dar nimeni nu observă',
      script: [
        { scene: 1, text: 'Realitatea: Progresul e vizibil TIE prima', visual: 'Selfie în oglindă' },
        { scene: 2, text: 'Altii observă după 15-20kg pierdute', visual: 'Text overlay' },
      ],
      cta: 'Swipe up pentru motivație zilnică',
      objective: 'Engagement',
      conversionRate: 31.8,
      leadMagnet: 'Daily motivation',
      dmKeyword: 'MOTIVAȚIE',
      reasoning: 'Validare emoțională. Setează așteptări realiste. Buildează trust.',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    },
    {
      format: 'REEL',
      hook: 'Clienta mea a slabit 12kg mâncând 3 mese pe zi',
      script: [
        { scene: 1, text: 'Zero snackuri. Zero 6 mese pe zi.', visual: 'Clip cu 3 farfurii' },
        { scene: 2, text: 'Doar 3 mese copioase și sățioase', visual: 'Rezultat before/after' },
        { scene: 3, text: 'Simplu > complicat', visual: 'CTA' },
      ],
      cta: 'Comentează 3MESE pentru planul complet',
      objective: 'Generare lead-uri',
      conversionRate: 44.6,
      leadMagnet: 'Plan 3 mese',
      dmKeyword: '3MESE',
      reasoning: 'Case study real. Simplifică procesul. Opoziția la mituri comune funcționează.',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  ];

  for (const ideaData of sampleIdeas) {
    await prisma.idea.create({
      data: {
        userId: demoUser.id,
        ...ideaData,
      },
    });
  }

  console.log(`✅ Created ${sampleIdeas.length} sample ideas`);

  // Create promo code
  const promoCode = await prisma.promoCode.upsert({
    where: { code: 'LAUNCH2026' },
    update: {},
    create: {
      code: 'LAUNCH2026',
      discountType: 'OVERRIDE',
      discountValue: 33, // 33% off
      finalPrice: 12.99, // Override to €12.99
      isActive: true,
      maxUses: null, // Unlimited uses
      expiresAt: new Date('2026-12-31'), // Valid until end of 2026
    },
  });

  console.log('✅ Created promo code:', promoCode.code);

  console.log('🎉 Seeding complete!');
  console.log('\nDemo credentials:');
  console.log('Email: demo@traineros.com');
  console.log('Password: demo123');
  console.log('\nPromo code: LAUNCH2026 (€19.9 → €12.99)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
