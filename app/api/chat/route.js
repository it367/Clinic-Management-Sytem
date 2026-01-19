import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// DATABASE QUERIES
// ============================================

async function getAllData() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [recon, billing, bills, orders, refunds, it, locations, users] = await Promise.all([
    supabase.from('daily_recon').select('*, locations(name), creator:created_by(name)').order('created_at', { ascending: false }).limit(200),
    supabase.from('billing_inquiries').select('*, locations(name), creator:created_by(name)').order('created_at', { ascending: false }).limit(200),
    supabase.from('bills_payment').select('*, locations(name), creator:created_by(name)').order('created_at', { ascending: false }).limit(200),
    supabase.from('order_requests').select('*, locations(name), creator:created_by(name)').order('created_at', { ascending: false }).limit(200),
    supabase.from('refund_requests').select('*, locations(name), creator:created_by(name)').order('created_at', { ascending: false }).limit(200),
    supabase.from('it_requests').select('*, locations(name), creator:created_by(name)').order('created_at', { ascending: false }).limit(200),
    supabase.from('locations').select('*').eq('is_active', true).order('name'),
    supabase.from('users').select('id, name, email, role, username, created_at, last_login').eq('is_active', true).order('name')
  ]);

  return {
    dailyRecon: recon.data || [],
    billingInquiries: billing.data || [],
    billsPayment: bills.data || [],
    orderRequests: orders.data || [],
    refundRequests: refunds.data || [],
    itRequests: it.data || [],
    locations: locations.data || [],
    users: users.data || []
  };
}

// ============================================
// BUILD COMPREHENSIVE DATA SUMMARY
// ============================================

function buildDataSummary(data) {
  const { dailyRecon, billingInquiries, billsPayment, orderRequests, refundRequests, itRequests, locations, users } = data;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  // Helper functions
  const thisWeek = (date) => new Date(date) >= sevenDaysAgo;
  const thisMonth = (date) => new Date(date) >= thirtyDaysAgo;
  const formatMoney = (num) => '$' + (num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ============ USERS ============
  const staffUsers = users.filter(u => u.role === 'staff');
  const adminUsers = users.filter(u => u.role === 'finance_admin');
  const superAdmins = users.filter(u => u.role === 'super_admin');
  const itUsers = users.filter(u => u.role === 'it');

  // ============ DAILY RECON ============
  const reconPending = dailyRecon.filter(r => !r.status || r.status === 'Pending');
  const reconAccounted = dailyRecon.filter(r => r.status === 'Accounted');
  const reconRejected = dailyRecon.filter(r => r.status === 'Rejected');
  const reconThisWeek = dailyRecon.filter(r => thisWeek(r.created_at));
  const reconThisMonth = dailyRecon.filter(r => thisMonth(r.created_at));
  
  const totalCollected = dailyRecon.reduce((sum, r) => sum + (parseFloat(r.total_collected) || 0), 0);
  const totalDeposited = dailyRecon.reduce((sum, r) => sum + (parseFloat(r.total_deposit) || 0), 0);
  const weekCollected = reconThisWeek.reduce((sum, r) => sum + (parseFloat(r.total_collected) || 0), 0);
  const weekDeposited = reconThisWeek.reduce((sum, r) => sum + (parseFloat(r.total_deposit) || 0), 0);

  // By location
  const reconByLocation = {};
  locations.forEach(l => reconByLocation[l.name] = { pending: 0, accounted: 0, collected: 0 });
  dailyRecon.forEach(r => {
    const loc = r.locations?.name;
    if (loc && reconByLocation[loc]) {
      if (!r.status || r.status === 'Pending') reconByLocation[loc].pending++;
      if (r.status === 'Accounted') reconByLocation[loc].accounted++;
      reconByLocation[loc].collected += parseFloat(r.total_collected) || 0;
    }
  });

  // ============ IT REQUESTS ============
  const itForReview = itRequests.filter(r => r.status === 'For Review');
  const itInProgress = itRequests.filter(r => r.status === 'In Progress');
  const itOnHold = itRequests.filter(r => r.status === 'On-hold');
  const itResolved = itRequests.filter(r => r.status === 'Resolved');
  const itCritical = itRequests.filter(r => r.urgency === 'Critical' && r.status !== 'Resolved');
  const itHigh = itRequests.filter(r => r.urgency === 'High' && r.status !== 'Resolved');
  const itUnassigned = itRequests.filter(r => !r.assigned_to && r.status !== 'Resolved');

  // ============ BILLING INQUIRIES ============
  const billingPending = billingInquiries.filter(r => r.status === 'Pending');
  const billingInProgress = billingInquiries.filter(r => r.status === 'In Progress');
  const billingResolved = billingInquiries.filter(r => r.status === 'Resolved');
  const billingTotal = billingInquiries.reduce((sum, r) => sum + (parseFloat(r.amount_in_question) || 0), 0);
  
  const billingByType = {};
  billingInquiries.forEach(r => {
    const type = r.inquiry_type || 'Other';
    billingByType[type] = (billingByType[type] || 0) + 1;
  });

  // ============ BILLS PAYMENT ============
  const billsPending = billsPayment.filter(r => r.bill_status === 'Pending' || (!r.paid || r.paid !== 'Yes'));
  const billsPaid = billsPayment.filter(r => r.paid === 'Yes');
  const billsOverdue = billsPayment.filter(r => r.paid !== 'Yes' && r.due_date && new Date(r.due_date) < now);
  const billsDueSoon = billsPayment.filter(r => {
    if (r.paid === 'Yes' || !r.due_date) return false;
    const due = new Date(r.due_date);
    const daysUntil = (due - now) / (1000 * 60 * 60 * 24);
    return daysUntil >= 0 && daysUntil <= 7;
  });
  const billsTotal = billsPayment.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const billsUnpaidTotal = billsPending.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  // Top vendors
  const vendorTotals = {};
  billsPayment.forEach(r => {
    const vendor = r.vendor || 'Unknown';
    vendorTotals[vendor] = (vendorTotals[vendor] || 0) + (parseFloat(r.amount) || 0);
  });
  const topVendors = Object.entries(vendorTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // ============ ORDER REQUESTS ============
  const ordersTotal = orderRequests.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const ordersThisMonth = orderRequests.filter(r => thisMonth(r.created_at));
  const ordersMonthTotal = ordersThisMonth.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  // ============ REFUND REQUESTS ============
  const refundsPending = refundRequests.filter(r => r.status === 'Pending');
  const refundsApproved = refundRequests.filter(r => r.status === 'Approved');
  const refundsCompleted = refundRequests.filter(r => r.status === 'Completed');
  const refundsDenied = refundRequests.filter(r => r.status === 'Denied');
  const refundsTotal = refundRequests.reduce((sum, r) => sum + (parseFloat(r.amount_requested) || 0), 0);
  const refundsPendingTotal = refundsPending.reduce((sum, r) => sum + (parseFloat(r.amount_requested) || 0), 0);

  // ============ BUILD SUMMARY ============
  let summary = `
========================================
COMPLETE SYSTEM DATA SNAPSHOT
Generated: ${now.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' })} Hawaii Time
========================================

USERS DIRECTORY (${users.length} active)
Staff: ${staffUsers.length} | Finance Admin: ${adminUsers.length} | Super Admin: ${superAdmins.length} | IT: ${itUsers.length}

Full User List:
${users.map(u => `  ${u.name} | ${u.email} | @${u.username || 'no-username'} | ${u.role} | Last login: ${u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}`).join('\n')}

LOCATIONS (${locations.length}): ${locations.map(l => l.name).join(', ')}

----------------------------------------
DAILY RECON SUMMARY
----------------------------------------
Total Records: ${dailyRecon.length}
This Week: ${reconThisWeek.length} entries

Status Breakdown:
  Pending Review: ${reconPending.length}
  Accounted: ${reconAccounted.length}
  Rejected: ${reconRejected.length}

Financial Summary (All Time):
  Total Collected: ${formatMoney(totalCollected)}
  Total Deposited: ${formatMoney(totalDeposited)}
  Variance: ${formatMoney(totalCollected - totalDeposited)}

This Week:
  Collected: ${formatMoney(weekCollected)}
  Deposited: ${formatMoney(weekDeposited)}
  Variance: ${formatMoney(weekCollected - weekDeposited)}

By Location:
${Object.entries(reconByLocation).map(([loc, data]) => `  ${loc}: ${data.pending} pending, ${data.accounted} accounted, ${formatMoney(data.collected)} collected`).join('\n')}
`;

  if (reconPending.length > 0) {
    summary += `
Pending Entries (needs review):
${reconPending.slice(0, 10).map(r => `  - ${r.recon_date} | ${r.locations?.name} | ${formatMoney(r.total_collected)} | by ${r.creator?.name || 'Unknown'}`).join('\n')}
`;
  }

  summary += `
----------------------------------------
IT REQUESTS SUMMARY
----------------------------------------
Total Tickets: ${itRequests.length}

Status Breakdown:
  For Review: ${itForReview.length}
  In Progress: ${itInProgress.length}
  On-hold: ${itOnHold.length}
  Resolved: ${itResolved.length}

Priority Alerts:
  Critical (Open): ${itCritical.length}
  High (Open): ${itHigh.length}
  Unassigned: ${itUnassigned.length}
`;

  const openTickets = [...itForReview, ...itInProgress, ...itOnHold];
  if (openTickets.length > 0) {
    summary += `
Open Tickets:
${openTickets.slice(0, 15).map(r => `  IT-${r.ticket_number} | ${r.urgency || 'Low'} | ${r.status} | ${r.locations?.name} | ${r.requester_name} | Assigned: ${r.assigned_to || 'Unassigned'} | "${(r.description_of_issue || '').substring(0, 40)}..."`).join('\n')}
`;
  }

  summary += `
----------------------------------------
BILLING INQUIRIES SUMMARY
----------------------------------------
Total: ${billingInquiries.length}
Pending: ${billingPending.length} | In Progress: ${billingInProgress.length} | Resolved: ${billingResolved.length}
Total Amount in Question: ${formatMoney(billingTotal)}

By Type: ${Object.entries(billingByType).map(([t, c]) => `${t}: ${c}`).join(', ')}
`;

  if (billingPending.length > 0) {
    summary += `
Pending Inquiries:
${billingPending.slice(0, 8).map(r => `  - ${r.patient_name} | ${r.inquiry_type || 'General'} | ${formatMoney(r.amount_in_question)} | ${r.locations?.name}`).join('\n')}
`;
  }

  summary += `
----------------------------------------
BILLS PAYMENT SUMMARY
----------------------------------------
Total Bills: ${billsPayment.length}
Total Amount: ${formatMoney(billsTotal)}

Status:
  Unpaid: ${billsPending.length} (${formatMoney(billsUnpaidTotal)})
  Paid: ${billsPaid.length}
  OVERDUE: ${billsOverdue.length}
  Due within 7 days: ${billsDueSoon.length}

Top Vendors:
${topVendors.map(([v, amt]) => `  - ${v}: ${formatMoney(amt)}`).join('\n')}
`;

  if (billsOverdue.length > 0) {
    summary += `
OVERDUE BILLS (Action Required):
${billsOverdue.slice(0, 8).map(r => `  - ${r.vendor} | ${formatMoney(r.amount)} | Due: ${r.due_date} | ${r.locations?.name}`).join('\n')}
`;
  }

  if (billsDueSoon.length > 0) {
    summary += `
Due Soon (Next 7 Days):
${billsDueSoon.slice(0, 5).map(r => `  - ${r.vendor} | ${formatMoney(r.amount)} | Due: ${r.due_date}`).join('\n')}
`;
  }

  summary += `
----------------------------------------
ORDER REQUESTS SUMMARY
----------------------------------------
Total Orders: ${orderRequests.length}
Total Amount: ${formatMoney(ordersTotal)}
This Month: ${ordersThisMonth.length} orders (${formatMoney(ordersMonthTotal)})
`;

  if (orderRequests.length > 0) {
    summary += `
Recent Orders:
${orderRequests.slice(0, 5).map(r => `  - ${r.vendor} | Invoice: ${r.invoice_number || 'N/A'} | ${formatMoney(r.amount)} | ${r.locations?.name}`).join('\n')}
`;
  }

  summary += `
----------------------------------------
REFUND REQUESTS SUMMARY
----------------------------------------
Total: ${refundRequests.length}
Total Requested: ${formatMoney(refundsTotal)}

Status:
  Pending: ${refundsPending.length} (${formatMoney(refundsPendingTotal)})
  Approved: ${refundsApproved.length}
  Completed: ${refundsCompleted.length}
  Denied: ${refundsDenied.length}
`;

  if (refundsPending.length > 0) {
    summary += `
Pending Refunds:
${refundsPending.slice(0, 8).map(r => `  - ${r.patient_name} | ${r.type || 'Refund'} | ${formatMoney(r.amount_requested)} | ${r.locations?.name}`).join('\n')}
`;
  }

  summary += `
========================================
END OF DATA SNAPSHOT
========================================
`;

  return summary;
}

// ============================================
// USER CAPABILITIES BASED ON ROLE
// ============================================

function getUserCapabilities(userContext) {
  if (!userContext?.isLoggedIn) {
    return `
USER STATUS: NOT LOGGED IN
The user is viewing the chat but has not authenticated. 
Provide general information only. Do not share sensitive data.
`;
  }

  const { userName, userEmail, userRole, isAdmin, isSuperAdmin, isIT, currentLocation, currentModule } = userContext;
  
  let info = `
========================================
CURRENT USER SESSION
========================================
Name: ${userName}
Email: ${userEmail}
Role: ${userRole}
Access Level: ${isSuperAdmin ? 'SUPER ADMIN (Highest)' : isIT ? 'IT ADMIN' : isAdmin ? 'FINANCE ADMIN' : 'STAFF'}
Currently Viewing: ${currentLocation || 'Not selected'} | Module: ${currentModule || 'None'}

`;

  if (isSuperAdmin) {
    info += `
SUPER ADMIN CAPABILITIES:
This user has FULL SYSTEM ACCESS. They can:

User Management:
  - View all users (User Management in sidebar)
  - Create new users
  - Edit any user's details
  - Reset any user's password
  - Delete/deactivate users
  - Assign users to locations
  - Change user roles

Records & Data:
  - View ALL locations
  - View ALL modules
  - Edit ANY record (no Friday cutoff)
  - Delete records
  - Review/approve Daily Recon entries
  - Update any record status
  - Export data from any module

IT Requests:
  - View all IT tickets
  - Update ticket status
  - Assign tickets to IT staff
  - Add resolution notes

HOW TO DO COMMON TASKS:

Reset a User's Password:
  1. Click "Users" in the sidebar
  2. Find the user in the list
  3. Click the pencil/edit icon
  4. Type new password in "New Password" field
  5. Click "Update User"

Create a New User:
  1. Click "Users" in the sidebar
  2. Click "Add User" button
  3. Fill in: Name, Username, Email, Password, Role
  4. If Staff role: select their location(s)
  5. Click "Add User"

Review Daily Recon:
  1. Click "Daily Recon" in sidebar
  2. Pending entries show in yellow
  3. Click "Review" on any entry
  4. Enter bank deposit amounts
  5. Set status: Accounted or Rejected
  6. Click "Submit Review"
`;
  } else if (isIT) {
    info += `
IT ADMIN CAPABILITIES:
This user manages IT support tickets. They can:

IT Requests:
  - View ALL IT tickets across all locations
  - Update ticket status (For Review → In Progress → On-hold → Resolved)
  - Assign tickets to themselves or other IT staff
  - Add resolution notes
  - Close tickets

Other Access:
  - View records in all modules (read-only for non-IT modules)
  - View all locations
  - Cannot manage users
  - Cannot approve Daily Recon

HOW TO MANAGE IT TICKETS:

Update a Ticket:
  1. Click "IT Requests" in sidebar
  2. Click on any ticket to open details
  3. Click "Update Status & Assignment"
  4. Change status, assign to someone, add notes
  5. Click "Save Changes"
`;
  } else if (isAdmin) {
    info += `
FINANCE ADMIN CAPABILITIES:
This user manages financial records. They can:

Daily Recon:
  - View all locations
  - Review pending entries
  - Enter bank deposit amounts
  - Mark as Accounted or Rejected

Other Modules:
  - View all records across all locations
  - Update record statuses
  - Export data

Cannot Do:
  - Manage users (Super Admin only)
  - Reset passwords (Super Admin only)
  - Delete users

HOW TO REVIEW DAILY RECON:

  1. Click "Daily Recon" in sidebar
  2. Yellow entries = Pending review
  3. Click "Review" button
  4. Compare cash can totals with bank deposit
  5. Enter actual deposit amounts
  6. Set status and click Submit
`;
  } else {
    info += `
STAFF CAPABILITIES:
This user enters data for their assigned location(s). They can:

Data Entry:
  - Enter new records in all modules
  - Upload supporting documents
  - Edit their OWN entries until Friday 11:59 PM Hawaii time
  - View their entry history

Cannot Do:
  - View other locations
  - Edit after Friday cutoff (admins must make changes)
  - Approve/reject records
  - Manage users
  - Export data

IMPORTANT: FRIDAY CUTOFF
Entries can only be edited until Friday 11:59 PM Hawaii time.
After that, only admins can modify records.
If the user needs a change after Friday, they should contact an admin.

HOW TO ENTER A DAILY RECON:

  1. Click "Daily Recon" in sidebar
  2. Make sure correct location is selected
  3. Enter date and all cash amounts
  4. Add notes if needed
  5. Upload EOD sheets (optional)
  6. Click "Save Entry"
`;
  }

  return info;
}

// ============================================
// MASTER SYSTEM PROMPT
// ============================================

function buildSystemPrompt(userContext, dataSummary, userCapabilities) {
  const hawaiiTime = new Date().toLocaleString('en-US', { 
    timeZone: 'Pacific/Honolulu', 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return `You are the AI Assistant for KidShine Hawaii's Clinic Management System (CMS).

========================================
FORMATTING RULES
========================================
You can use basic markdown for better readability:
- Use **text** for bold/emphasis on important items
- Use *text* for italics when needed
- Use dashes (-) for bullet points
- Use numbers (1. 2. 3.) for ordered steps
- Use blank lines to separate sections

Keep responses clean, organized, and professional.
Format money as $1,234.56

========================================
ABOUT KIDSHINE HAWAII
========================================
KidShine Hawaii is a pediatric dental organization serving children across Hawaii.
They operate 8 clinic locations and use this CMS to manage daily operations.

LOCATIONS:
- Pearl City
- OS (Outpatient Services)
- Ortho (Orthodontics)
- Lihue (on Kauai island)
- Kapolei
- Kailua
- Honolulu
- HHDS (Hawaii Health & Dental Services)

========================================
USER ROLES EXPLAINED
========================================

SUPER ADMIN (Highest Access)
- Full system control
- User management (create, edit, delete users)
- Password resets for any user
- View/edit all locations and modules
- No restrictions

FINANCE ADMIN
- View all locations
- Review and approve Daily Recon
- Update record statuses
- Export data
- Cannot manage users

IT
- Full IT Request access
- Can update tickets, assign, resolve
- View all locations
- Cannot manage users

STAFF
- Assigned location(s) only
- Enter/edit own records
- IMPORTANT: Editing locked after Friday 11:59 PM Hawaii time
- View own history only

========================================
THE 6 MODULES IN DETAIL
========================================

1. DAILY RECON (Daily Cash Reconciliation)
   Purpose: Track daily cash collected at each clinic
   
   Staff enters CASH CAN totals:
   - Cash
   - Credit Card (OTC)
   - Checks (OTC)
   - Insurance Checks
   - Care Credit
   - VCC (Virtual Credit Card)
   - EFTs (Electronic Funds Transfer)
   System auto-calculates: Total Collected
   
   Admin enters BANK DEPOSIT amounts:
   - Same categories as above
   System auto-calculates: Total Deposited
   
   VARIANCE = Total Collected - Total Deposited
   (Should be $0 when everything matches)
   
   Statuses:
   - Pending (yellow) = Needs admin review
   - Accounted (green) = Verified, deposits match
   - Rejected (red) = Discrepancy found
   
   Workflow:
   1. Staff enters daily totals at end of day
   2. Staff uploads EOD sheets, bank receipts
   3. Admin reviews cash can vs actual deposit
   4. Admin marks Accounted or Rejected

2. BILLING INQUIRY
   Purpose: Track patient billing questions and disputes
   
   Fields:
   - Patient Name, Chart Number, Parent Name
   - Date of Request
   - Inquiry Type: Refund, Balance, Insurance, Payment Plan, Other
   - Description of issue
   - Amount in Question
   - Best Contact Method & Time
   - Billing Team Reviewed (who reviewed)
   - Date Reviewed
   - Result
   
   Statuses: Pending → In Progress → Resolved

3. BILLS PAYMENT
   Purpose: Track vendor bills and payments
   
   Fields:
   - Vendor name
   - Bill Date, Due Date
   - Amount
   - Description
   - Manager Initials
   - AP Reviewed (Yes/No)
   - Paid (Yes/No)
   
   Statuses: Pending → Approved → Paid
   
   Key alerts: Overdue bills, upcoming due dates

4. ORDER REQUESTS
   Purpose: Track purchase orders and invoices
   
   Fields:
   - Date Entered
   - Vendor
   - Invoice Number
   - Invoice Date
   - Due Date
   - Amount
   - Entered By
   - Notes

5. REFUND REQUESTS
   Purpose: Track patient refund/credit requests
   
   Fields:
   - Patient Name, Chart Number, Parent Name
   - RP Address (Responsible Party)
   - Date of Request
   - Type: Refund, Credit, or Adjustment
   - Description
   - Amount Requested
   - Best Contact Method
   - eAssist Audited (Yes/No/N/A)
   
   Statuses: Pending → Approved → Completed / Denied

6. IT REQUESTS
   Purpose: Internal IT support ticket system
   
   Fields:
   - Ticket Number (auto-generated: IT-1, IT-2, etc.)
   - Date Reported
   - Urgency: Low, Medium, High, Critical
   - Requester Name
   - Device/System affected
   - Description of Issue
   - Best Contact Method & Time
   - Assigned To (IT staff member)
   - Status
   - Resolution Notes
   
   Statuses: For Review → In Progress → On-hold → Resolved
   
   Workflow:
   1. Staff submits IT request describing issue
   2. IT admin reviews and assigns
   3. IT works on issue, updates status
   4. IT adds resolution notes and marks Resolved

========================================
KEY SYSTEM RULES
========================================

FRIDAY CUTOFF (Very Important!)
- Staff can edit their entries until Friday 11:59 PM Hawaii time
- After that, records are LOCKED
- Only admins can modify locked records
- This ensures data integrity for weekly reporting

FILE UPLOADS
- Users can attach documents to any entry
- Supported: Images, PDFs, Word docs, Excel files
- Files stored securely in system
- Can preview images, download others

SESSION & LOGIN
- "Remember Me" keeps user logged in for 30 days
- Sessions sync across browser tabs
- Logout from one tab logs out all tabs

========================================
NAVIGATION GUIDE
========================================

SIDEBAR (Left side):
- Shows all modules
- Admins see: Analytics, all modules, Documents, Export, Users
- Staff see: All modules for data entry
- IT sees: Focus on IT Requests

TOP HEADER:
- Shows current module name
- Shows current location filter
- Loading indicator when fetching data

FOR STAFF:
- "New Entry" tab = Enter new data
- "History" tab = View/edit past entries
- Can only see assigned location(s)

FOR ADMINS:
- "Records" view shows all entries
- Location dropdown to filter
- Can click any entry to preview/edit

SETTINGS (Bottom of sidebar):
- Change display name
- Change password
- View login history (admins)
- Logout

========================================
COMMON QUESTIONS & ANSWERS
========================================

Q: How do I reset someone's password?
A: (Super Admin only) Go to Users → Find user → Click Edit → Enter new password → Update User

Q: Why can't I edit my entry?
A: If it's after Friday 11:59 PM Hawaii time, entries are locked. Contact an admin to make changes.

Q: How do I see all locations?
A: Only Finance Admin, Super Admin, and IT can see all locations. Staff only see assigned locations.

Q: How do I export data?
A: (Admin only) Click Export in sidebar → Select module, location, date range → Export to CSV

Q: What does the variance mean in Daily Recon?
A: Variance = Total Collected - Total Deposited. Should be $0 when cash matches deposits. Positive means more collected than deposited. Negative means more deposited than collected.

Q: How do I assign an IT ticket?
A: (IT/Admin only) Click the ticket → Update Status & Assignment → Select assignee → Save

Q: Why is my entry showing yellow/pending?
A: Daily Recon entries start as Pending until a Finance Admin reviews and marks them Accounted or Rejected.

Q: Can I delete a record?
A: Only Super Admins can delete records. Contact your Super Admin if needed.

Q: How do I add a new staff member?
A: (Super Admin only) Users → Add User → Fill details → Select their location(s) → Add User

========================================
CURRENT SESSION INFO
========================================
${userCapabilities}

========================================
LIVE DATABASE
========================================
${dataSummary}

========================================
RESPONSE INSTRUCTIONS
========================================

1. Address the user by name when appropriate

2. Check their role before answering:
   - If they ask to do something they CAN'T do, explain why and who can help
   - If they CAN do it, give step-by-step instructions

3. Use the live data above to answer questions:
   - Give specific numbers, names, amounts
   - Reference actual records when relevant
   - If asked about a specific user/record, look it up in the data

4. NEVER say "I don't have access to that data" if the data IS in your context above
   - User list is provided - share user details when admins ask
   - All record summaries are provided - use them

5. Keep responses concise but complete:
   - Short answers for simple questions
   - Step-by-step for "how do I" questions
   - Summaries for "show me" questions

6. For data questions, format clearly:
   - Use line breaks
   - Align numbers
   - Group related info

7. If something is urgent (overdue bills, critical IT tickets), mention it proactively

Current Hawaii Time: ${hawaiiTime}
`;
}

// ============================================
// MAIN API HANDLER
// ============================================

export async function POST(request) {
  const { messages, userContext } = await request.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      content: [{ type: 'text', text: 'AI not configured. Add ANTHROPIC_API_KEY to environment variables.' }]
    });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      content: [{ type: 'text', text: 'Database not configured. Add SUPABASE_SERVICE_ROLE_KEY to environment variables.' }]
    });
  }

  try {
    // Get all live data
    const data = await getAllData();
    
    // Build comprehensive summaries
    const dataSummary = buildDataSummary(data);
    const userCapabilities = getUserCapabilities(userContext);
    
    // Build the master prompt
    const systemPrompt = buildSystemPrompt(userContext, dataSummary, userCapabilities);

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return NextResponse.json({
        content: [{ type: 'text', text: 'AI service error. Please try again in a moment.' }]
      });
    }

    return NextResponse.json(await response.json());

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      content: [{ type: 'text', text: 'Connection error. Please check your internet and try again.' }]
    });
  }
}
