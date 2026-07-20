'use strict';
'use server';

import { db } from '@/db';
import { areas, collectors, technicians, servicePlans, customers, bills, collections, complaints, stbInventory, expenses } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Re-seed Database
export async function triggerReseed() {
  try {
    // Drop all records in a safe order and re-seed
    await db.delete(complaints);
    await db.delete(collections);
    await db.delete(bills);
    await db.delete(customers);
    await db.delete(stbInventory);
    await db.delete(expenses);
    await db.delete(collectors);
    await db.delete(technicians);
    await db.delete(servicePlans);
    await db.delete(areas);

    const { seedDatabase } = await import('@/db/seed');
    await seedDatabase();
    revalidatePath('/');
    return { success: true, message: 'Database reset and seeded successfully!' };
  } catch (error: any) {
    console.error('Failed to re-seed database:', error);
    return { success: false, error: error.message };
  }
}

// 1. Area Actions
export async function createArea(data: { name: string; code: string }) {
  try {
    const newArea = await db.insert(areas).values({
      name: data.name,
      code: data.code.toUpperCase(),
    }).returning();
    revalidatePath('/');
    return { success: true, area: newArea[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Collector Actions
export async function createCollector(data: { name: string; phone: string; email?: string; areaId?: number }) {
  try {
    const newCollector = await db.insert(collectors).values({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      areaId: data.areaId || null,
      balance: 0,
    }).returning();
    revalidatePath('/');
    return { success: true, collector: newCollector[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Technician Actions
export async function createTechnician(data: { name: string; phone: string; email?: string; specialization: string }) {
  try {
    const newTech = await db.insert(technicians).values({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      specialization: data.specialization,
    }).returning();
    revalidatePath('/');
    return { success: true, technician: newTech[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Service Plan Actions
export async function createServicePlan(data: { name: string; type: string; monthlyCharge: number; tax: number; speedOrDetails?: string }) {
  try {
    const newPlan = await db.insert(servicePlans).values({
      name: data.name,
      type: data.type,
      monthlyCharge: Number(data.monthlyCharge),
      tax: Number(data.tax),
      speedOrDetails: data.speedOrDetails || null,
    }).returning();
    revalidatePath('/');
    return { success: true, plan: newPlan[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Customer Actions
export async function createCustomer(data: {
  name: string;
  customerCode: string;
  phone: string;
  email?: string;
  address: string;
  areaId: number;
  collectorId: number;
  connectionType: string;
  cablePlanId?: number;
  internetPlanId?: number;
}) {
  try {
    // Calculate initial balance based on selected plans
    let initialBalance = 0;
    if (data.connectionType === 'Cable' || data.connectionType === 'Both') {
      if (data.cablePlanId) {
        const plan = await db.select().from(servicePlans).where(eq(servicePlans.id, data.cablePlanId));
        if (plan[0]) {
          initialBalance += plan[0].monthlyCharge + plan[0].tax;
        }
      }
    }
    if (data.connectionType === 'Internet' || data.connectionType === 'Both') {
      if (data.internetPlanId) {
        const plan = await db.select().from(servicePlans).where(eq(servicePlans.id, data.internetPlanId));
        if (plan[0]) {
          initialBalance += plan[0].monthlyCharge + plan[0].tax;
        }
      }
    }

    const newCust = await db.insert(customers).values({
      name: data.name,
      customerCode: data.customerCode.toUpperCase(),
      phone: data.phone,
      email: data.email || null,
      address: data.address,
      areaId: data.areaId,
      collectorId: data.collectorId,
      connectionType: data.connectionType,
      cablePlanId: data.cablePlanId || null,
      internetPlanId: data.internetPlanId || null,
      balance: initialBalance,
      status: 'Active',
    }).returning();

    // Also auto-generate an initial bill for this customer
    if (initialBalance > 0) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15); // due in 15 days

      // Calculate separate charge & tax
      let totalPlanCharge = 0;
      let totalTax = 0;
      if (data.cablePlanId) {
        const plan = await db.select().from(servicePlans).where(eq(servicePlans.id, data.cablePlanId));
        if (plan[0]) {
          totalPlanCharge += plan[0].monthlyCharge;
          totalTax += plan[0].tax;
        }
      }
      if (data.internetPlanId) {
        const plan = await db.select().from(servicePlans).where(eq(servicePlans.id, data.internetPlanId));
        if (plan[0]) {
          totalPlanCharge += plan[0].monthlyCharge;
          totalTax += plan[0].tax;
        }
      }

      await db.insert(bills).values({
        customerId: newCust[0].id,
        billDate: new Date(),
        dueDate,
        planCharge: totalPlanCharge,
        tax: totalTax,
        totalAmount: initialBalance,
        status: 'Unpaid',
        collectorId: data.collectorId,
      });
    }

    revalidatePath('/');
    return { success: true, customer: newCust[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Record Bill Payment
export async function payBill(data: {
  customerId: number;
  amountPaid: number;
  paymentMethod: string;
  collectorId?: number; // Optional, set if collected by a collector
}) {
  try {
    const customerId = Number(data.customerId);
    const amountPaid = Number(data.amountPaid);
    
    // 1. Find customer and check balance
    const customerList = await db.select().from(customers).where(eq(customers.id, customerId));
    if (customerList.length === 0) {
      throw new Error('Customer not found');
    }
    const customer = customerList[0];
    const actualCollectorId = data.collectorId || customer.collectorId;

    // 2. Insert Collection Record
    const newCollection = await db.insert(collections).values({
      customerId,
      collectorId: actualCollectorId as number,
      amount: amountPaid,
      paymentDate: new Date(),
      paymentMode: data.paymentMethod,
      settlementStatus: 'Pending', // Pending admin settlement
    }).returning();

    // 3. Find Unpaid Bills for this customer, and apply payment
    const unpaidBills = await db.select()
      .from(bills)
      .where(and(eq(bills.customerId, customerId), eq(bills.status, 'Unpaid')))
      .orderBy(bills.billDate);

    let remainingPayment = amountPaid;
    for (const bill of unpaidBills) {
      if (remainingPayment <= 0) break;

      const unpaidAmountOnBill = bill.totalAmount - bill.paidAmount;
      if (remainingPayment >= unpaidAmountOnBill) {
        // Fully pay this bill
        await db.update(bills)
          .set({
            status: 'Paid',
            paidAmount: bill.totalAmount,
            paidDate: new Date(),
            paymentMethod: data.paymentMethod,
            collectorId: actualCollectorId,
          })
          .where(eq(bills.id, bill.id));
        remainingPayment -= unpaidAmountOnBill;
      } else {
        // Partially pay this bill
        await db.update(bills)
          .set({
            paidAmount: bill.paidAmount + remainingPayment,
            paymentMethod: data.paymentMethod,
            collectorId: actualCollectorId,
          })
          .where(eq(bills.id, bill.id));
        remainingPayment = 0;
      }
    }

    // 4. Update Customer Balance
    const newBalance = Math.max(0, customer.balance - amountPaid);
    await db.update(customers)
      .set({ balance: newBalance })
      .where(eq(customers.id, customerId));

    // 5. Update Collector Pending Balance
    if (actualCollectorId) {
      const collectorList = await db.select().from(collectors).where(eq(collectors.id, actualCollectorId));
      if (collectorList.length > 0) {
        const collector = collectorList[0];
        await db.update(collectors)
          .set({ balance: collector.balance + amountPaid })
          .where(eq(collectors.id, actualCollectorId));
      }
    }

    revalidatePath('/');
    return { success: true, collection: newCollection[0], updatedBalance: newBalance };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Settle Collector Pending Cash (Admin marks as Settled)
export async function settleCollector(collectorId: number) {
  try {
    const colId = Number(collectorId);
    
    // 1. Update all Pending collections for this collector to Settled
    await db.update(collections)
      .set({
        settlementStatus: 'Settled',
        settledDate: new Date(),
      })
      .where(and(eq(collections.collectorId, colId), eq(collections.settlementStatus, 'Pending')));

    // 2. Set collector pending balance to 0
    await db.update(collectors)
      .set({ balance: 0 })
      .where(eq(collectors.id, colId));

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. Submit Complaint
export async function submitComplaint(data: { customerId: number; type: string; description: string; priority?: string }) {
  try {
    const newComplaint = await db.insert(complaints).values({
      customerId: Number(data.customerId),
      type: data.type,
      description: data.description,
      status: 'Open',
      priority: data.priority || 'Medium',
      createdDate: new Date(),
    }).returning();
    revalidatePath('/');
    return { success: true, complaint: newComplaint[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 9. Assign/Update Complaint (Technician or Admin)
export async function updateComplaint(id: number, data: { status: string; comments?: string; assignedTechnicianId?: number }) {
  try {
    const updateFields: any = {
      status: data.status,
      comments: data.comments || null,
    };

    if (data.status === 'Closed') {
      updateFields.closedDate = new Date();
    }
    if (data.assignedTechnicianId) {
      updateFields.assignedTechnicianId = Number(data.assignedTechnicianId);
    }

    const updated = await db.update(complaints)
      .set(updateFields)
      .where(eq(complaints.id, Number(id)))
      .returning();

    revalidatePath('/');
    return { success: true, complaint: updated[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 10. STB Box Inventory actions
export async function createSTBBox(data: { stbNumber: string; type: string; status: string; assignedCustomerName?: string }) {
  try {
    const newBox = await db.insert(stbInventory).values({
      stbNumber: data.stbNumber.toUpperCase(),
      type: data.type,
      status: data.status,
      assignedCustomerName: data.assignedCustomerName || null,
      updatedDate: new Date(),
    }).returning();
    revalidatePath('/');
    return { success: true, stb: newBox[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSTBStatus(id: number, status: string, assignedCustomerName?: string) {
  try {
    await db.update(stbInventory)
      .set({
        status,
        assignedCustomerName: assignedCustomerName || null,
        updatedDate: new Date(),
      })
      .where(eq(stbInventory.id, Number(id)));
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 11. Expense Actions
export async function createExpense(data: { title: string; amount: number; category: string; notes?: string }) {
  try {
    const newExpense = await db.insert(expenses).values({
      title: data.title,
      amount: Number(data.amount),
      category: data.category,
      notes: data.notes || null,
      date: new Date(),
    }).returning();
    revalidatePath('/');
    return { success: true, expense: newExpense[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 12. Monthly billing batch runner
export async function runMonthlyBilling() {
  try {
    // Query active customers
    const activeCustomers = await db.select().from(customers).where(eq(customers.status, 'Active'));
    let countGenerated = 0;
    let totalBilledAmount = 0;

    for (const cust of activeCustomers) {
      let planCharge = 0;
      let tax = 0;

      if (cust.connectionType === 'Cable' || cust.connectionType === 'Both') {
        if (cust.cablePlanId) {
          const plan = await db.select().from(servicePlans).where(eq(servicePlans.id, cust.cablePlanId));
          if (plan[0]) {
            planCharge += plan[0].monthlyCharge;
            tax += plan[0].tax;
          }
        }
      }

      if (cust.connectionType === 'Internet' || cust.connectionType === 'Both') {
        if (cust.internetPlanId) {
          const plan = await db.select().from(servicePlans).where(eq(servicePlans.id, cust.internetPlanId));
          if (plan[0]) {
            planCharge += plan[0].monthlyCharge;
            tax += plan[0].tax;
          }
        }
      }

      const totalAmount = planCharge + tax;
      if (totalAmount > 0) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15); // due in 15 days

        // 1. Create a bill
        await db.insert(bills).values({
          customerId: cust.id,
          billDate: new Date(),
          dueDate,
          planCharge,
          tax,
          totalAmount,
          status: 'Unpaid',
          collectorId: cust.collectorId,
        });

        // 2. Update customer outstanding balance
        await db.update(customers)
          .set({ balance: cust.balance + totalAmount })
          .where(eq(customers.id, cust.id));

        countGenerated++;
        totalBilledAmount += totalAmount;
      }
    }

    revalidatePath('/');
    return { success: true, count: countGenerated, totalAmount: totalBilledAmount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
