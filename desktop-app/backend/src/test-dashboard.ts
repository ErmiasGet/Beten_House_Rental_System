import prisma from './config/database';

async function test() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('NO USER');
    return;
  }
  console.log('User:', user.id, user.email);

  const houses = await prisma.house.findMany({
    where: { ownerId: user.id },
    include: { rooms: true },
  });
  const totalHouses = houses.length;
  const totalRooms = houses.reduce((s: number, h: any) => s + h.rooms.length, 0);
  const occupiedRooms = houses.reduce(
    (s: number, h: any) => s + h.rooms.filter((r: any) => r.status === 'OCCUPIED').length,
    0
  );
  const vacantRooms = houses.reduce(
    (s: number, h: any) => s + h.rooms.filter((r: any) => r.status === 'AVAILABLE').length,
    0
  );

  const now = new Date();
  const cm = now.getMonth() + 1;
  const cy = now.getFullYear();
  console.log('Current month:', cm, 'year:', cy);

  const income = await prisma.payment.aggregate({
    where: { status: 'PAID', month: cm, year: cy, room: { house: { ownerId: user.id } } },
    _sum: { amount: true },
  });
  const pending = await prisma.payment.count({
    where: { status: 'UNPAID', month: cm, year: cy, room: { house: { ownerId: user.id } } },
  });
  const overdue = await prisma.payment.count({
    where: {
      room: { house: { ownerId: user.id } },
      OR: [
        { status: 'OVERDUE' },
        { status: 'PARTIAL' },
        { status: 'UNPAID', OR: [{ year: { lt: cy } }, { year: cy, month: { lt: cm } }] },
      ],
    },
  });

  const allPayments = await prisma.payment.findMany({
    select: { month: true, year: true, status: true, amount: true },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  console.log('All payments:', JSON.stringify(allPayments, null, 2));

  const result = {
    totalHouses,
    totalRooms,
    occupiedRooms,
    vacantRooms,
    monthlyIncome: income._sum.amount || 0,
    pendingPayments: pending,
    overduePayments: overdue,
  };
  console.log('\nDASHBOARD RESULT:', JSON.stringify(result, null, 2));

  // Now simulate the full API response
  const apiResponse = { success: true, data: result };
  console.log('\nAPI RESPONSE:', JSON.stringify(apiResponse, null, 2));

  // Simulate what frontend does: response.data.data
  const axiosResponse = { data: apiResponse };
  const extracted = axiosResponse.data.data;
  console.log('\nFRONTEND EXTRACTS (response.data.data):', JSON.stringify(extracted, null, 2));

  await prisma.$disconnect();
}
test().catch((e) => {
  console.error(e);
  process.exit(1);
});
