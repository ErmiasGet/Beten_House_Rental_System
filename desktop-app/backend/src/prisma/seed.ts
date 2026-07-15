import prisma from '../config/database';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('BetenHomes@2026', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@betora.com' },
    update: {},
    create: {
      fullName: 'System Admin',
      email: 'admin@betora.com',
      phone: '+251911111111',
      password: hashedPassword,
      role: 'OWNER',
      isActive: true,
    },
  });
  console.log('Created admin user:', admin.email);

  const house = await prisma.house.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Beten Homes Heights',
      address: 'Bole Sub-city, Addis Ababa',
      description: 'A modern apartment building in the heart of the city',
      numberOfFloors: 5,
      totalRooms: 20,
      ownerId: admin.id,
    },
  });
  console.log('Created sample house:', house.name);

  const rooms = [];
  for (let floor = 1; floor <= 5; floor++) {
    for (let roomNum = 1; roomNum <= 4; roomNum++) {
      const roomNumber = `${floor}0${roomNum}`;
      const room = await prisma.room.upsert({
        where: { houseId_roomNumber: { houseId: house.id, roomNumber } },
        update: {
          status: roomNum <= 2 ? 'OCCUPIED' : 'AVAILABLE',
        },
        create: {
          roomNumber,
          floorNumber: floor,
          length: 6 + Math.random() * 4,
          width: 5 + Math.random() * 4,
          bedrooms: roomNum % 2 === 0 ? 2 : 1,
          bathrooms: 1,
          hasKitchen: roomNum % 2 === 0,
          monthlyRent: 5000 + Math.random() * 10000,
          depositAmount: 10000,
          houseId: house.id,
          status: roomNum <= 2 ? 'OCCUPIED' : 'AVAILABLE',
        },
      });
      rooms.push(room);
    }
  }
  console.log(`Created ${rooms.length} rooms`);

  // --- Tenant 1: Abebe Kebede (paid up to date) ---
  const tenant = await prisma.tenant.upsert({
    where: { nationalId: 'ID123456' },
    update: { roomId: rooms[0].id },
    create: {
      fullName: 'Abebe Kebede',
      phone: '+251922222222',
      email: 'abebe@example.com',
      nationalId: '123456789012',
      occupation: 'Software Engineer',
      emergencyName: 'Kebede Abebe',
      emergencyPhone: '+251933333333',
      roomId: rooms[0].id,
    },
  });
  const existingContract = await prisma.rentalContract.findFirst({
    where: { tenantId: tenant.id },
  });
  if (existingContract) {
    await prisma.payment.deleteMany({ where: { contractId: existingContract.id } });
    await prisma.rentalContract.delete({ where: { id: existingContract.id } });
  }
  const contract = await prisma.rentalContract.create({
    data: {
      tenantId: tenant.id,
      houseId: house.id,
      roomId: rooms[0].id,
      startDate: new Date('2024-01-01'),
      monthlyRent: rooms[0].monthlyRent,
      deposit: rooms[0].depositAmount,
      paymentDay: 1,
      status: 'ACTIVE',
    },
  });
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  for (let month = 1; month <= currentMonth; month++) {
    await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        roomId: rooms[0].id,
        contractId: contract.id,
        amount: rooms[0].monthlyRent,
        paymentDate: new Date(currentYear, month - 1, 1),
        paymentMethod: 'BANK_TRANSFER',
        month,
        year: currentYear,
        status: 'PAID',
        receiptNumber: `RCT-${month}-${Date.now()}`,
      },
    });
  }
  console.log('Created sample tenant:', tenant.fullName);

  // ========== TEST SEED: OVERDUE & DUE-TODAY TENANTS ==========

  const overdueRoom = rooms[2];
  const dueTodayRoom = rooms[3];

  await prisma.room.update({
    where: { id: overdueRoom.id },
    data: { status: 'OCCUPIED' },
  });
  await prisma.room.update({
    where: { id: dueTodayRoom.id },
    data: { status: 'OCCUPIED' },
  });

  // --- Overdue Tenant: Bekele Alemu (paymentDay: 1, unpaid Jan-Jun 2026) ---
  const overdueTenant = await prisma.tenant.upsert({
    where: { nationalId: 'ID654321' },
    update: { roomId: overdueRoom.id },
    create: {
      fullName: 'Bekele Alemu',
      phone: '+251944444444',
      email: 'bekele@example.com',
      nationalId: '654321098765',
      occupation: 'Teacher',
      emergencyName: 'Alemu Bekele',
      emergencyPhone: '+251955555555',
      roomId: overdueRoom.id,
    },
  });

  const existingOverdueContract = await prisma.rentalContract.findFirst({
    where: { tenantId: overdueTenant.id },
  });
  if (existingOverdueContract) {
    await prisma.payment.deleteMany({ where: { contractId: existingOverdueContract.id } });
    await prisma.rentalContract.delete({ where: { id: existingOverdueContract.id } });
  }

  const overdueContract = await prisma.rentalContract.create({
    data: {
      tenantId: overdueTenant.id,
      houseId: house.id,
      roomId: overdueRoom.id,
      startDate: new Date('2026-01-01'),
      monthlyRent: overdueRoom.monthlyRent,
      deposit: overdueRoom.depositAmount,
      paymentDay: 1,
      status: 'ACTIVE',
    },
  });

  for (let month = 1; month <= currentMonth; month++) {
    await prisma.payment.create({
      data: {
        tenantId: overdueTenant.id,
        roomId: overdueRoom.id,
        contractId: overdueContract.id,
        amount: overdueRoom.monthlyRent,
        paymentDate: new Date(currentYear, month - 1, 1),
        paymentMethod: 'BANK_TRANSFER',
        month,
        year: currentYear,
        status: month < currentMonth ? 'UNPAID' : 'UNPAID',
        receiptNumber: `OVERDUE-${month}-${Date.now()}`,
      },
    });
  }
  console.log('Created overdue test tenant:', overdueTenant.fullName);

  // --- Due Today Tenant: Chaltu Desta (paymentDay: 9, matches today July 9) ---
  const dueTodayTenant = await prisma.tenant.upsert({
    where: { nationalId: 'ID789012' },
    update: { roomId: dueTodayRoom.id },
    create: {
      fullName: 'Chaltu Desta',
      phone: '+251966666666',
      email: 'chaltu@example.com',
      nationalId: '789012345678',
      occupation: 'Nurse',
      emergencyName: 'Desta Chaltu',
      emergencyPhone: '+251977777777',
      roomId: dueTodayRoom.id,
    },
  });

  const existingDueTodayContract = await prisma.rentalContract.findFirst({
    where: { tenantId: dueTodayTenant.id },
  });
  if (existingDueTodayContract) {
    await prisma.payment.deleteMany({ where: { contractId: existingDueTodayContract.id } });
    await prisma.rentalContract.delete({ where: { id: existingDueTodayContract.id } });
  }

  await prisma.rentalContract.create({
    data: {
      tenantId: dueTodayTenant.id,
      houseId: house.id,
      roomId: dueTodayRoom.id,
      startDate: new Date('2026-01-01'),
      monthlyRent: dueTodayRoom.monthlyRent,
      deposit: dueTodayRoom.depositAmount,
      paymentDay: currentMonth,
      status: 'ACTIVE',
    },
  });

  await prisma.payment.create({
    data: {
      tenantId: dueTodayTenant.id,
      roomId: dueTodayRoom.id,
      contractId: (await prisma.rentalContract.findFirst({
        where: { tenantId: dueTodayTenant.id },
      }))!.id,
      amount: dueTodayRoom.monthlyRent,
      paymentDate: new Date(currentYear, currentMonth - 1, 1),
      paymentMethod: 'CASH',
      month: currentMonth,
      year: currentYear,
      status: 'UNPAID',
      receiptNumber: `DUE-${currentMonth}-${Date.now()}`,
    },
  });

  console.log('Created due-today test tenant:', dueTodayTenant.fullName);
  console.log('Seeding completed!');
}

seed()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
