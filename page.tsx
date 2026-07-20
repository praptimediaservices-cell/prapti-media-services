import { db } from '@/db';
import {
  areas as areasTable,
  collectors as collectorsTable,
  technicians as techniciansTable,
  servicePlans as servicePlansTable,
  customers as customersTable,
  bills as billsTable,
  collections as collectionsTable,
  complaints as complaintsTable,
  stbInventory as stbInventoryTable,
  expenses as expensesTable
} from '@/db/schema';
import { count } from 'drizzle-orm';
import { seedDatabase } from '@/db/seed';
import DashboardClient from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // Check if seeding is needed on load
  const existingAreas = await db.select({ val: count() }).from(areasTable);
  if (existingAreas[0].val === 0) {
    await seedDatabase();
  }

  // Retrieve all data in parallel
  const allAreas = await db.select().from(areasTable);
  const allCollectors = await db.select().from(collectorsTable);
  const allTechnicians = await db.select().from(techniciansTable);
  const allServicePlans = await db.select().from(servicePlansTable);
  const allCustomers = await db.select().from(customersTable);
  const allBills = await db.select().from(billsTable);
  const allCollections = await db.select().from(collectionsTable);
  const allComplaints = await db.select().from(complaintsTable);
  const allSTB = await db.select().from(stbInventoryTable);
  const allExpenses = await db.select().from(expensesTable);

  // Serialize Date objects to ISO strings
  const serializedCustomers = allCustomers.map(c => ({
    ...c,
    installationDate: c.installationDate.toISOString()
  }));

  const serializedBills = allBills.map(b => ({
    ...b,
    billDate: b.billDate.toISOString(),
    dueDate: b.dueDate.toISOString(),
    paidDate: b.paidDate ? b.paidDate.toISOString() : null
  }));

  const serializedCollections = allCollections.map(c => ({
    ...c,
    paymentDate: c.paymentDate.toISOString(),
    settledDate: c.settledDate ? c.settledDate.toISOString() : null
  }));

  const serializedComplaints = allComplaints.map(c => ({
    ...c,
    createdDate: c.createdDate.toISOString(),
    closedDate: c.closedDate ? c.closedDate.toISOString() : null
  }));

  const serializedSTB = allSTB.map(s => ({
    ...s,
    updatedDate: s.updatedDate.toISOString()
  }));

  const serializedExpenses = allExpenses.map(e => ({
    ...e,
    date: e.date.toISOString()
  }));

  return (
    <DashboardClient
      areas={allAreas}
      collectors={allCollectors}
      technicians={allTechnicians}
      servicePlans={allServicePlans}
      customers={serializedCustomers}
      bills={serializedBills}
      collections={serializedCollections}
      complaints={serializedComplaints}
      stb={serializedSTB}
      expenses={serializedExpenses}
    />
  );
}
