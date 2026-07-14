import prisma from '../config/database';
import { IIncomeReport, IExpenseReport, IOccupancyReport, IPayment, IExpense } from '@beten-homes-rent/shared';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

export class ReportService {
  async getIncomeReport(userId: string, startDate: Date, endDate: Date): Promise<IIncomeReport> {
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: startDate, lte: endDate },
        status: 'PAID',
        room: { house: { ownerId: userId } },
      },
      include: {
        tenant: { select: { fullName: true } },
        room: { select: { roomNumber: true } },
      },
      orderBy: { paymentDate: 'asc' },
    });

    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);

    const monthlyMap = new Map<string, number>();
    payments.forEach((p) => {
      const key = `${p.year}-${p.month}`;
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + p.amount);
    });

    const monthlyBreakdown = Array.from(monthlyMap.entries()).map(([key, amount]) => {
      const [year, month] = key.split('-').map(Number);
      return { month, year, amount };
    });

    return { totalIncome, payments: payments as any as IPayment[], monthlyBreakdown };
  }

  async getExpenseReport(userId: string, startDate: Date, endDate: Date): Promise<IExpenseReport> {
    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: { gte: startDate, lte: endDate },
        house: { ownerId: userId },
      },
      include: {
        house: { select: { name: true } },
      },
      orderBy: { expenseDate: 'asc' },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryMap = new Map<string, { amount: number; count: number }>();
    expenses.forEach((e) => {
      const current = categoryMap.get(e.category) || { amount: 0, count: 0 };
      categoryMap.set(e.category, {
        amount: current.amount + e.amount,
        count: current.count + 1,
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category: category as any,
      ...data,
    }));

    return { totalExpenses, expenses: expenses as any as IExpense[], categoryBreakdown };
  }

  async getOccupancyReport(userId: string): Promise<IOccupancyReport> {
    const houses = await prisma.house.findMany({
      where: { ownerId: userId },
      include: {
        rooms: true,
      },
    });

    const totalRooms = houses.reduce((sum, h) => sum + h.rooms.length, 0);
    const occupiedRooms = houses.reduce(
      (sum, h) => sum + h.rooms.filter((r) => r.status === 'OCCUPIED').length,
      0
    );
    const vacantRooms = houses.reduce(
      (sum, h) => sum + h.rooms.filter((r) => r.status === 'AVAILABLE').length,
      0
    );

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    const houseBreakdown = houses.map((h) => ({
      houseId: h.id,
      houseName: h.name,
      occupied: h.rooms.filter((r) => r.status === 'OCCUPIED').length,
      total: h.rooms.length,
    }));

    return { totalRooms, occupiedRooms, vacantRooms, occupancyRate, houseBreakdown };
  }

  async generatePaymentReportPDF(res: Response, payments: any[]): Promise<void> {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('Payment Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    const tableTop = doc.y;
    const headers = ['Date', 'Tenant', 'Room', 'Amount', 'Method', 'Status'];
    const columnWidths = [80, 120, 60, 80, 100, 80];

    doc.fontSize(10).font('Helvetica-Bold');
    let xPos = 50;
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableTop, { width: columnWidths[i], align: 'left' });
      xPos += columnWidths[i];
    });

    doc.moveDown(0.5);
    doc.font('Helvetica');

    let yPos = doc.y;
    payments.forEach((payment, index) => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      xPos = 50;
      const row = [
        new Date(payment.paymentDate).toLocaleDateString(),
        payment.tenant.fullName,
        payment.room.roomNumber,
        payment.amount.toFixed(2),
        payment.paymentMethod,
        payment.status,
      ];

      doc.fontSize(8);
      row.forEach((cell, i) => {
        doc.text(cell, xPos, yPos, { width: columnWidths[i], align: 'left' });
        xPos += columnWidths[i];
      });

      yPos += 20;
    });

    doc.end();
  }

  async generateExpenseReportPDF(res: Response, expenses: any[]): Promise<void> {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('Expense Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    const headers = ['Date', 'Category', 'Description', 'Amount', 'House'];
    const columnWidths = [80, 100, 150, 80, 90];

    doc.fontSize(10).font('Helvetica-Bold');
    let xPos = 50;
    headers.forEach((header, i) => {
      doc.text(header, xPos, doc.y, { width: columnWidths[i], align: 'left' });
      xPos += columnWidths[i];
    });

    doc.moveDown(0.5);
    doc.font('Helvetica');

    expenses.forEach((expense) => {
      xPos = 50;
      const row = [
        new Date(expense.expenseDate).toLocaleDateString(),
        expense.category,
        expense.description.substring(0, 30),
        expense.amount.toFixed(2),
        expense.house.name,
      ];

      doc.fontSize(8);
      row.forEach((cell, i) => {
        doc.text(cell, xPos, doc.y, { width: columnWidths[i], align: 'left' });
        xPos += columnWidths[i];
      });
      doc.moveDown(0.5);
    });

    doc.end();
  }
}
