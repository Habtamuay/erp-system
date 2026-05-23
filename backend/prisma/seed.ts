import { PrismaClient, AccountType, AccountCategory, Role, ItemType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Chart of Accounts data from new version
export const chartOfAccounts = [
  // ==================== ASSETS ====================
  // Cash & Bank
  { code: '1010', name: 'Cash at Bank', type: AccountType.ASSET, category: AccountCategory.CASH_AND_BANK, groupName: 'Current Assets' },
  { code: '1020', name: 'Bank Overdraft', type: AccountType.LIABILITY, category: AccountCategory.BORROWINGS, groupName: 'Current Liabilities' },
  
  // Trade Receivables
  { code: '1101', name: 'Trade receivables', type: AccountType.ASSET, category: AccountCategory.TRADE_RECEIVABLES, groupName: 'Current Assets' },
  { code: '1102', name: 'Purchase Advance', type: AccountType.ASSET, category: AccountCategory.TRADE_RECEIVABLES, groupName: 'Current Assets' },
  { code: '1103', name: 'Sundry receivables', type: AccountType.ASSET, category: AccountCategory.TRADE_RECEIVABLES, groupName: 'Current Assets' },
  { code: '1104', name: 'Staff Debtors', type: AccountType.ASSET, category: AccountCategory.TRADE_RECEIVABLES, groupName: 'Current Assets' },
  { code: '1105', name: 'Advance and Claims', type: AccountType.ASSET, category: AccountCategory.TRADE_RECEIVABLES, groupName: 'Current Assets' },
  { code: '1106', name: 'Withholding Tax Receivable', type: AccountType.ASSET, category: AccountCategory.TRADE_RECEIVABLES, groupName: 'Current Assets' },
  { code: '1107', name: 'Container Deposits', type: AccountType.ASSET, category: AccountCategory.TRADE_RECEIVABLES, groupName: 'Current Assets' },
  
  // Prepayments
  { code: '1201', name: 'Prepaid Insurance', type: AccountType.ASSET, category: AccountCategory.PREPAYMENTS, groupName: 'Current Assets' },
  { code: '1202', name: 'Prepayments', type: AccountType.ASSET, category: AccountCategory.PREPAYMENTS, groupName: 'Current Assets' },
  
  // Related Party
  { code: '1301', name: 'Related Party Receivable', type: AccountType.ASSET, category: AccountCategory.RELATED_PARTY, groupName: 'Current Assets' },
  
  // Inventory
  { code: '1401', name: 'Raw Materials', type: AccountType.ASSET, category: AccountCategory.INVENTORY, groupName: 'Current Assets' },
  { code: '1402', name: 'Packing Materials', type: AccountType.ASSET, category: AccountCategory.INVENTORY, groupName: 'Current Assets' },
  { code: '1403', name: 'Finished Goods', type: AccountType.ASSET, category: AccountCategory.INVENTORY, groupName: 'Current Assets' },
  { code: '1404', name: 'Indirect Materials', type: AccountType.ASSET, category: AccountCategory.INVENTORY, groupName: 'Current Assets' },
  { code: '1405', name: 'Goods in transit', type: AccountType.ASSET, category: AccountCategory.INVENTORY, groupName: 'Current Assets' },
  { code: '1406', name: 'Stationary and Office Supplies', type: AccountType.ASSET, category: AccountCategory.INVENTORY, groupName: 'Current Assets' },
  { code: '1499', name: 'Allowance for inventory Write-down', type: AccountType.ASSET, category: AccountCategory.INVENTORY, groupName: 'Current Assets' },
  
  // Work In Process
  { code: '1501', name: 'Raw Materials used for production', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1502', name: 'Packing Materials used for production', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1503', name: 'Laboratory Testing', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1504', name: 'Salary and Wage', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1505', name: 'Bonus and Employee Benefits', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1506', name: 'Depreciation', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1507', name: 'Repair and maintenance', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1508', name: 'Utilities', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1509', name: 'Fuel and lubricants', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1510', name: 'Loading and unloading', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1511', name: 'Cleaning and sanitation', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1512', name: 'Medical', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1513', name: 'Royalty of Raw Materials', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1514', name: 'Uniform', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1515', name: 'Bank charge and other costs', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  { code: '1599', name: 'Work In Process - Closing', type: AccountType.ASSET, category: AccountCategory.WORK_IN_PROCESS, groupName: 'Current Assets' },
  
  // Non-Current Assets
  { code: '1601', name: 'Right of Use Land', type: AccountType.ASSET, category: AccountCategory.RIGHT_OF_USE, groupName: 'Non-Current Assets' },
  { code: '1602', name: 'Accumulated Amortization - Land', type: AccountType.ASSET, category: AccountCategory.RIGHT_OF_USE, groupName: 'Non-Current Assets' },
  
  // Property, Plant & Equipment
  { code: '1701', name: 'Building', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1702', name: 'Accumulated Depreciation - Building', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1711', name: 'Machinery', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1712', name: 'Accumulated Depreciation - Machinery', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1721', name: 'Motor Vehicle', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1722', name: 'Accumulated Depreciation - Vehicle', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1731', name: 'Computers', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1732', name: 'Accumulated Depreciation - Computers', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1741', name: 'Office Furniture & Equipment', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1742', name: 'Accumulated Depreciation - Office Equip', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1751', name: 'Other Assets', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1752', name: 'Accumulated Depreciation - Other Assets', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1761', name: 'Construction In Progress', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1771', name: 'FV Deemed Cost - Land Improvement', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  { code: '1772', name: 'Accumulated Depreciation - Land Improvement', type: AccountType.ASSET, category: AccountCategory.PROPERTY_PLANT_EQUIPMENT, groupName: 'Non-Current Assets' },
  
  // Investments
  { code: '1801', name: 'Investment in Debt Securities', type: AccountType.ASSET, category: AccountCategory.INVESTMENTS, groupName: 'Non-Current Assets' },
  { code: '1802', name: 'Investment in Equity Security', type: AccountType.ASSET, category: AccountCategory.INVESTMENTS, groupName: 'Non-Current Assets' },
  
  // ==================== LIABILITIES ====================
  
  // Trade Payables
  { code: '2010', name: 'Trade payables', type: AccountType.LIABILITY, category: AccountCategory.TRADE_PAYABLES, groupName: 'Current Liabilities' },
  { code: '2020', name: 'Sundry payable', type: AccountType.LIABILITY, category: AccountCategory.TRADE_PAYABLES, groupName: 'Current Liabilities' },
  { code: '2030', name: 'Accruals', type: AccountType.LIABILITY, category: AccountCategory.ACCRUALS, groupName: 'Current Liabilities' },
  { code: '2040', name: 'Employee Benefit', type: AccountType.LIABILITY, category: AccountCategory.ACCRUALS, groupName: 'Current Liabilities' },
  { code: '2050', name: 'Unearned revenue', type: AccountType.LIABILITY, category: AccountCategory.ACCRUALS, groupName: 'Current Liabilities' },
  { code: '2060', name: 'Dividend Payable', type: AccountType.LIABILITY, category: AccountCategory.ACCRUALS, groupName: 'Current Liabilities' },
  { code: '2070', name: 'Management fee payable', type: AccountType.LIABILITY, category: AccountCategory.ACCRUALS, groupName: 'Current Liabilities' },
  
  // Tax Payables
  { code: '2110', name: 'VAT Payable', type: AccountType.LIABILITY, category: AccountCategory.TAX_PAYABLES, groupName: 'Current Liabilities' },
  { code: '2120', name: 'Withholding tax payable', type: AccountType.LIABILITY, category: AccountCategory.TAX_PAYABLES, groupName: 'Current Liabilities' },
  { code: '2130', name: 'Payroll tax payable', type: AccountType.LIABILITY, category: AccountCategory.TAX_PAYABLES, groupName: 'Current Liabilities' },
  { code: '2140', name: 'Other tax payables', type: AccountType.LIABILITY, category: AccountCategory.TAX_PAYABLES, groupName: 'Current Liabilities' },
  { code: '2150', name: 'Profit Tax Payable', type: AccountType.LIABILITY, category: AccountCategory.TAX_PAYABLES, groupName: 'Current Liabilities' },
  { code: '2160', name: 'Provision for tax assessment', type: AccountType.LIABILITY, category: AccountCategory.TAX_PAYABLES, groupName: 'Current Liabilities' },
  
  // Related Party
  { code: '2210', name: 'Related Party Payable', type: AccountType.LIABILITY, category: AccountCategory.RELATED_PARTY_PAYABLE, groupName: 'Current Liabilities' },
  { code: '2220', name: 'Related parties loans', type: AccountType.LIABILITY, category: AccountCategory.RELATED_PARTY_PAYABLE, groupName: 'Non-Current Liabilities' },
  
  // Borrowings
  { code: '2310', name: 'Bank Loan - Current Portion', type: AccountType.LIABILITY, category: AccountCategory.BORROWINGS, groupName: 'Current Liabilities' },
  { code: '2320', name: 'Bank Loan - Long Term Portion', type: AccountType.LIABILITY, category: AccountCategory.BORROWINGS, groupName: 'Non-Current Liabilities' },
  
  // Lease
  { code: '2410', name: 'Lease Obligation - Current', type: AccountType.LIABILITY, category: AccountCategory.LEASE_OBLIGATIONS, groupName: 'Current Liabilities' },
  { code: '2420', name: 'Lease Obligation - Long Term', type: AccountType.LIABILITY, category: AccountCategory.LEASE_OBLIGATIONS, groupName: 'Non-Current Liabilities' },
  
  // Defined Benefit
  { code: '2510', name: 'Defined Benefit Obligation', type: AccountType.LIABILITY, category: AccountCategory.DEFINED_BENEFIT, groupName: 'Non-Current Liabilities' },
  
  // Deferred Tax
  { code: '2610', name: 'Deferred tax liability', type: AccountType.LIABILITY, category: AccountCategory.TAX_PAYABLES, groupName: 'Non-Current Liabilities' },
  
  // ==================== EQUITY ====================
  
  { code: '3010', name: 'Share Capital', type: AccountType.EQUITY, category: AccountCategory.SHARE_CAPITAL, groupName: 'Equity' },
  { code: '3020', name: 'Retained earnings', type: AccountType.EQUITY, category: AccountCategory.RETAINED_EARNINGS, groupName: 'Equity' },
  { code: '3030', name: 'Legal reserve', type: AccountType.EQUITY, category: AccountCategory.RESERVES, groupName: 'Equity' },
  { code: '3040', name: 'Reserve for Deemed Cost', type: AccountType.EQUITY, category: AccountCategory.RESERVES, groupName: 'Equity' },
  { code: '3050', name: 'Reserve for Customs Valuation', type: AccountType.EQUITY, category: AccountCategory.RESERVES, groupName: 'Equity' },
  
  // ==================== INCOME ====================
  
  // Revenue
  { code: '4010', name: 'Revenue - Plumpy Nut', type: AccountType.INCOME, category: AccountCategory.REVENUE, groupName: 'Revenue' },
  { code: '4020', name: 'Revenue - Supplementary Plumpy Nut', type: AccountType.INCOME, category: AccountCategory.REVENUE, groupName: 'Revenue' },
  { code: '4030', name: 'Revenue - Maleda Peanut Butter', type: AccountType.INCOME, category: AccountCategory.REVENUE, groupName: 'Revenue' },
  
  // Other Income
  { code: '4110', name: 'Sales of Material', type: AccountType.INCOME, category: AccountCategory.OTHER_INCOME, groupName: 'Other Income' },
  { code: '4120', name: 'Sales of Scrap', type: AccountType.INCOME, category: AccountCategory.OTHER_INCOME, groupName: 'Other Income' },
  { code: '4130', name: 'Gain on Disposal of assets', type: AccountType.INCOME, category: AccountCategory.OTHER_INCOME, groupName: 'Other Income' },
  { code: '4140', name: 'Foreign Exchange Gain', type: AccountType.INCOME, category: AccountCategory.OTHER_INCOME, groupName: 'Other Income' },
  { code: '4150', name: 'Reversal of Accruals', type: AccountType.INCOME, category: AccountCategory.OTHER_INCOME, groupName: 'Other Income' },
  { code: '4160', name: 'Finished goods average', type: AccountType.INCOME, category: AccountCategory.OTHER_INCOME, groupName: 'Other Income' },
  { code: '4199', name: 'Other Income', type: AccountType.INCOME, category: AccountCategory.OTHER_INCOME, groupName: 'Other Income' },
  
  // ==================== EXPENSES ====================
  
  // Cost of Sales
  { code: '5010', name: 'Cost of goods sold', type: AccountType.EXPENSE, category: AccountCategory.COST_OF_SALES, groupName: 'Cost of Sales' },
  { code: '5020', name: 'Cost of Goods Manufactured', type: AccountType.EXPENSE, category: AccountCategory.COST_OF_SALES, groupName: 'Cost of Sales' },
  
  // Selling & Distribution
  { code: '5110', name: 'Salary and Benefits - Selling', type: AccountType.EXPENSE, category: AccountCategory.SELLING_DISTRIBUTION, groupName: 'Selling & Distribution' },
  { code: '5120', name: 'Commission', type: AccountType.EXPENSE, category: AccountCategory.SELLING_DISTRIBUTION, groupName: 'Selling & Distribution' },
  { code: '5130', name: 'Transportation Expense', type: AccountType.EXPENSE, category: AccountCategory.SELLING_DISTRIBUTION, groupName: 'Selling & Distribution' },
  { code: '5140', name: 'Export Clearing Cost', type: AccountType.EXPENSE, category: AccountCategory.SELLING_DISTRIBUTION, groupName: 'Selling & Distribution' },
  { code: '5150', name: 'Advertisement and Promotion', type: AccountType.EXPENSE, category: AccountCategory.SELLING_DISTRIBUTION, groupName: 'Selling & Distribution' },
  { code: '5160', name: 'Insurance Expense - Selling', type: AccountType.EXPENSE, category: AccountCategory.SELLING_DISTRIBUTION, groupName: 'Selling & Distribution' },
  { code: '5170', name: 'Loading and Unloading - Selling', type: AccountType.EXPENSE, category: AccountCategory.SELLING_DISTRIBUTION, groupName: 'Selling & Distribution' },
  { code: '5180', name: 'Travel and Per diem - Selling', type: AccountType.EXPENSE, category: AccountCategory.SELLING_DISTRIBUTION, groupName: 'Selling & Distribution' },
  { code: '5199', name: 'Other Selling Expenses', type: AccountType.EXPENSE, category: AccountCategory.SELLING_DISTRIBUTION, groupName: 'Selling & Distribution' },
  
  // General & Administration
  { code: '5210', name: 'Salary and Benefits - G&A', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5220', name: 'Depreciation and Amortization', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5230', name: 'Repair and Maintenance', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5240', name: 'Utilities', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5250', name: 'Insurance - G&A', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5260', name: 'Fuel and Lubricant', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5270', name: 'Rental Expense', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5280', name: 'Travel and Per diem - G&A', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5290', name: 'Professional Fees', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5310', name: 'Stationary and Office Supplies', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5320', name: 'Communications', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5330', name: 'License and Registration', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5340', name: 'Penalties', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5350', name: 'Entertainment', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5360', name: 'Donations', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5370', name: 'Medical Expense', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5380', name: 'Cafeteria Expense', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5390', name: 'Sanitation Expense', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5410', name: 'Demurrage', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5420', name: 'Hotel Accommodation', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5430', name: 'Municipality Fees', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5440', name: 'Tire and Tubes', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5450', name: 'ERCA Tax Assessment charges and penalty', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5460', name: 'Exchange Rate Loss', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5470', name: 'Write Off Expense', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  { code: '5499', name: 'Miscellaneous Expenses', type: AccountType.EXPENSE, category: AccountCategory.GENERAL_ADMIN, groupName: 'General & Administration' },
  
  // Finance Costs
  { code: '6010', name: 'Interest Expense', type: AccountType.EXPENSE, category: AccountCategory.FINANCE_COSTS, groupName: 'Finance Costs' },
  { code: '6020', name: 'Bank Charge', type: AccountType.EXPENSE, category: AccountCategory.FINANCE_COSTS, groupName: 'Finance Costs' },
];

// Cash Flow Mappings from old version
const cashFlowMappings = [
  { accountCode: '1506', activity: 'OPERATING', type: 'NON_CASH', direction: 'INCREASE' }, // Depreciation
  { accountCode: '1401', activity: 'OPERATING', type: 'WORKING_CAPITAL', direction: 'INCREASE' }, // Raw Materials
  { accountCode: '1403', activity: 'OPERATING', type: 'WORKING_CAPITAL', direction: 'INCREASE' }, // Finished Goods
  { accountCode: '1101', activity: 'OPERATING', type: 'WORKING_CAPITAL', direction: 'INCREASE' }, // Trade receivables
  { accountCode: '2010', activity: 'OPERATING', type: 'WORKING_CAPITAL', direction: 'DECREASE' }, // Trade payables
  { accountCode: '1711', activity: 'INVESTING', type: 'CASH', direction: 'DECREASE' }, // Machinery
  { accountCode: '1721', activity: 'INVESTING', type: 'CASH', direction: 'DECREASE' }, // Motor Vehicle
  { accountCode: '2310', activity: 'FINANCING', type: 'CASH', direction: 'INCREASE' }, // Bank Loan
];

// Sample items data
const sampleItems = [
  { code: 'RM-001', name: 'Wheat Flour', type: ItemType.RAW_MATERIAL, category: 'FLOUR', uom: 'KG', unitCost: 45, sellingPrice: 55, currentStock: 0 },
  { code: 'RM-002', name: 'Sugar', type: ItemType.RAW_MATERIAL, category: 'SWEETENER', uom: 'KG', unitCost: 65, sellingPrice: 75, currentStock: 0 },
  { code: 'RM-003', name: 'Vegetable Oil', type: ItemType.RAW_MATERIAL, category: 'OIL', uom: 'LTR', unitCost: 120, sellingPrice: 140, currentStock: 0 },
  { code: 'PM-001', name: 'Packaging Box', type: ItemType.PACKING_MATERIAL, category: 'PACKAGING', uom: 'PC', unitCost: 15, sellingPrice: 20, currentStock: 0 },
  { code: 'FG-001', name: 'Enriched Biscuits', type: ItemType.FINISHED_GOOD, category: 'BAKERY', uom: 'BOX', unitCost: 180, sellingPrice: 250, currentStock: 0 },
  { code: 'FG-002', name: 'Plumpy Nut', type: ItemType.FINISHED_GOOD, category: 'NUTRITION', uom: 'BOX', unitCost: 350, sellingPrice: 450, currentStock: 0 },
];

export async function seedAccounts(companyId: string) {
  console.log('Seeding chart of accounts...');
  
  for (const account of chartOfAccounts) {
    await prisma.account.upsert({
      where: { code_companyId: { code: account.code, companyId } },
      update: {},
      create: {
        ...account,
        classification: account.groupName === 'Current Assets' ? 'CURRENT' : 
                        account.groupName === 'Non-Current Assets' ? 'NON_CURRENT' : null,
        companyId,
      },
    });
  }
  
  console.log(`✅ Created ${chartOfAccounts.length} accounts`);
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default company
  const company = await prisma.company.upsert({
    where: { code: 'HILINA001' },
    update: {},
    create: {
      code: 'HILINA001',
      name: 'Hilina Enriched Foods PLC',
      currency: 'ETB',
      fiscalYearStart: new Date('2024-07-01'),
      fiscalYearEnd: new Date('2025-06-30'),
      taxId: '0012345678',
      phone: '+251-11-123-4567',
      email: 'info@hilinafoods.com',
      address: 'Addis Ababa, Ethiopia',
      isActive: true,
    },
  });
  console.log(`✅ Company created: ${company.name}`);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@hilinafoods.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@hilinafoods.com',
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Admin user created: ${user.email}`);

  // Link user to company
  await prisma.companyUser.upsert({
    where: { userId_companyId: { userId: user.id, companyId: company.id } },
    update: {},
    create: {
      userId: user.id,
      companyId: company.id,
      role: 'ADMIN',
    },
  });
  console.log(`✅ User linked to company`);

  // Seed Chart of Accounts
  await seedAccounts(company.id);

  // Create Cash Flow Mappings
  console.log('Seeding cash flow mappings...');
  for (const mapping of cashFlowMappings) {
    const account = await prisma.account.findFirst({
      where: { code: mapping.accountCode, companyId: company.id },
    });
    if (account) {
      await prisma.cashFlowMapping.upsert({
        where: { accountId_companyId: { accountId: account.id, companyId: company.id } },
        update: {},
        create: {
          accountId: account.id,
          companyId: company.id,
          activity: mapping.activity,
          type: mapping.type,
          direction: mapping.direction,
        },
      });
    }
  }
  console.log(`✅ Created ${cashFlowMappings.length} cash flow mappings`);

  // Seed sample items
  console.log('Seeding sample items...');
  for (const item of sampleItems) {
    await prisma.item.upsert({
      where: { code_companyId: { code: item.code, companyId: company.id } },
      update: {},
      create: { ...item, companyId: company.id },
    });
  }
  console.log(`✅ Created ${sampleItems.length} sample items`);

  // Create sample warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'warehouse-1' },
    update: {},
    create: {
      id: 'warehouse-1',
      name: 'Main Warehouse',
      location: 'Addis Ababa',
      companyId: company.id,
    },
  });
  console.log(`✅ Warehouse created: ${warehouse.name}`);

  // Create initial system settings
  await prisma.systemSetting.upsert({
    where: { key: 'company_settings' },
    update: {},
    create: {
      key: 'company_settings',
      value: {
        fiscalYearStart: '2024-07-01',
        fiscalYearEnd: '2025-06-30',
        taxRate: 0.15,
        currency: 'ETB',
      },
      description: 'Company global settings',
      companyId: company.id,
    },
  });
  console.log(`✅ System settings created`);

  console.log('🎉 Database seeding completed successfully!');
}

// Export seed functions for individual use
export async function seedCompany() {
  return await prisma.company.upsert({
    where: { code: 'HILINA001' },
    update: {},
    create: {
      code: 'HILINA001',
      name: 'Hilina Enriched Foods PLC',
      currency: 'ETB',
      fiscalYearStart: new Date('2024-07-01'),
      fiscalYearEnd: new Date('2025-06-30'),
      taxId: '0012345678',
      phone: '+251-11-123-4567',
      email: 'info@hilinafoods.com',
      address: 'Addis Ababa, Ethiopia',
      isActive: true,
    },
  });
}

export async function seedUser(companyId: string) {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@hilinafoods.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@hilinafoods.com',
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  await prisma.companyUser.upsert({
    where: { userId_companyId: { userId: user.id, companyId } },
    update: {},
    create: {
      userId: user.id,
      companyId,
      role: 'ADMIN',
    },
  });
  
  return user;
}

// Run main function if this file is executed directly
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default main;