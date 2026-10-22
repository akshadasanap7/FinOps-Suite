/* ================================================================
   FINOPS SUITE — app.js
   Vanilla JS ES6+ | State Management via localStorage
   Modules: Expense Tracker | P2P Lending | Invoice Generator
   ================================================================ */

'use strict';

/* ── Helpers ── */
const $ = id => document.getElementById(id);
const fmt = n => '$' + Number(n).toFixed(2);

/** Show a toast notification */
function toast(msg, type = 'info') {
  const el = $('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  setTimeout(() => el.classList.remove('show'), 3000);
}

/** Load from localStorage with fallback */
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

/** Save to localStorage */
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

/* ================================================================
   GLOBAL STATE
   ================================================================ */
let state = {
  expenses:     load('expenses', []),
  wallet:       load('wallet', { balance: 0, transactions: [] }),
  loans:        load('loans', []),
  invoices:     load('invoices', []),
  role:         load('role', 'employee'),   // 'employee' | 'manager'
  theme:        load('theme', 'dark'),
};

/* ── Persist entire state ── */
function persist() {
  save('expenses',     state.expenses);
  save('wallet',       state.wallet);
  save('loans',        state.loans);
  save('invoices',     state.invoices);
  save('role',         state.role);
  save('theme',        state.theme);
}

/* ================================================================
   THEME TOGGLE
   ================================================================ */
function applyTheme() {
  document.body.classList.toggle('light-theme', state.theme === 'light');
  $('themeToggle').textContent = state.theme === 'light' ? '🌙' : '☀️';
}

$('themeToggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  persist();
});

/* ================================================================
   TAB NAVIGATION
   ================================================================ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    $(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

/* ================================================================
   MODULE 1 — CORPORATE EXPENSE TRACKER & APPROVAL WORKFLOW
   ================================================================ */

/** Render all expense items and update dashboard stats */
function renderExpenses() {
  const list = $('expenseList');
  const isManager = state.role === 'manager';

  // Compute stats
  const total    = state.expenses.reduce((s, e) => s + e.amount, 0);
  const approved = state.expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
  const pending  = state.expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const rejected = state.expenses.filter(e => e.status === 'rejected').reduce((s, e) => s + e.amount, 0);

  $('statTotal').textContent    = fmt(total);
  $('statApproved').textContent = fmt(approved);
  $('statPending').textContent  = fmt(pending);
  $('statRejected').textContent = fmt(rejected);

  if (!state.expenses.length) {
    list.innerHTML = '<p class="empty-state">No expenses submitted yet.</p>';
    return;
  }

  list.innerHTML = state.expenses.map(exp => `
    <div class="expense-item" data-id="${exp.id}">
      <div class="expense-info">
        <div class="expense-title">${exp.title}</div>
        <div class="expense-meta">${exp.category} &bull; ${exp.date} ${exp.notes ? '&bull; ' + exp.notes : ''}</div>
      </div>
      <div class="expense-amount">${fmt(exp.amount)}</div>
      <span class="badge badge-${exp.status}">${exp.status}</span>
      ${isManager && exp.status === 'pending' ? `
        <div class="expense-actions">
          <button class="btn-approve" data-id="${exp.id}">✓ Approve</button>
          <button class="btn-reject"  data-id="${exp.id}">✗ Reject</button>
        </div>` : ''}
      ${isManager ? `<button class="btn btn-sm btn-danger" style="padding:0.25rem 0.6rem;font-size:0.75rem;" data-delete="${exp.id}">🗑</button>` : ''}
    </div>`).join('');

  // Approve / Reject / Delete event delegation
  list.querySelectorAll('.btn-approve').forEach(btn =>
    btn.addEventListener('click', () => updateExpenseStatus(btn.dataset.id, 'approved')));
  list.querySelectorAll('.btn-reject').forEach(btn =>
    btn.addEventListener('click', () => updateExpenseStatus(btn.dataset.id, 'rejected')));
  list.querySelectorAll('[data-delete]').forEach(btn =>
    btn.addEventListener('click', () => deleteExpense(btn.dataset.delete)));
}

function updateExpenseStatus(id, status) {
  const exp = state.expenses.find(e => e.id === id);
  if (exp) { exp.status = status; persist(); renderExpenses(); toast(`Expense ${status}`, status === 'approved' ? 'success' : 'error'); }
}

function deleteExpense(id) {
  state.expenses = state.expenses.filter(e => e.id !== id);
  persist(); renderExpenses(); toast('Expense deleted', 'info');
}

/** Handle expense form submission */
$('expenseForm').addEventListener('submit', e => {
  e.preventDefault();
  const title    = $('expTitle').value.trim();
  const category = $('expCategory').value;
  const amount   = parseFloat($('expAmount').value);
  const date     = $('expDate').value;

  if (!title || !category || !amount || !date) { toast('Please fill all required fields', 'error'); return; }

  state.expenses.unshift({
    id:       crypto.randomUUID(),
    title, category, amount, date,
    notes:    $('expNotes').value.trim(),
    status:   'pending',
    created:  Date.now()
  });

  persist();
  renderExpenses();
  e.target.reset();
  toast('Expense submitted successfully', 'success');
});

/** Role switcher */
function applyRole() {
  const isManager = state.role === 'manager';
  $('roleEmployee').classList.toggle('active', !isManager);
  $('roleManager').classList.toggle('active', isManager);
  // Hide submission form for manager
  $('expenseFormCard').style.display = isManager ? 'none' : 'block';
  renderExpenses();
}

$('roleEmployee').addEventListener('click', () => { state.role = 'employee'; persist(); applyRole(); });
$('roleManager').addEventListener('click',  () => { state.role = 'manager';  persist(); applyRole(); });

/* ================================================================
   MODULE 2 — MICRO-FINANCE / P2P LENDING SIMULATOR
   ================================================================ */

/** Render wallet balance and transaction history */
function renderWallet() {
  $('walletBalance').textContent = fmt(state.wallet.balance);

  const txList = $('transactionList');
  if (!state.wallet.transactions.length) {
    txList.innerHTML = '<li class="empty-state">No transactions yet.</li>';
    return;
  }
  txList.innerHTML = state.wallet.transactions.slice(-10).reverse().map(tx => `
    <li>
      <span>${tx.label}</span>
      <span class="${tx.type === 'credit' ? 'tx-credit' : 'tx-debit'}">
        ${tx.type === 'credit' ? '+' : '-'}${fmt(tx.amount)}
      </span>
    </li>`).join('');
}

/** Update credit score display based on debt-to-balance ratio */
function renderCreditProfile() {
  const totalDebt = state.loans
    .filter(l => l.status === 'active')
    .reduce((s, l) => s + l.remaining, 0);

  const balance = state.wallet.balance;
  const ratio   = balance > 0 ? (totalDebt / (balance + totalDebt)) : (totalDebt > 0 ? 1 : 0);

  // Credit score: starts at 800, penalised by debt ratio and number of loans
  let score = Math.max(300, Math.round(800 - ratio * 400 - state.loans.filter(l => l.status === 'active').length * 15));

  const label = score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : score >= 580 ? 'Poor' : 'Very Poor';
  const color = score >= 700 ? '#22c55e' : score >= 620 ? '#f59e0b' : '#ef4444';

  $('creditScoreVal').textContent = score;
  $('scoreLabel').textContent     = label;
  $('scoreRing').style.borderColor = color;
  $('creditScoreVal').style.color  = color;

  $('activeLoansCount').textContent = state.loans.filter(l => l.status === 'active').length;
  $('totalDebt').textContent        = fmt(totalDebt);
  $('debtRatio').textContent        = (ratio * 100).toFixed(1) + '%';

  return score;
}

/** Deposit / Withdraw */
function walletTransaction(type) {
  const amt = parseFloat($('walletAmount').value);
  if (!amt || amt <= 0) { toast('Enter a valid amount', 'error'); return; }

  if (type === 'debit' && amt > state.wallet.balance) {
    toast('Insufficient balance', 'error'); return;
  }

  state.wallet.balance += type === 'credit' ? amt : -amt;
  state.wallet.transactions.push({
    label:  type === 'credit' ? 'Deposit' : 'Withdrawal',
    amount: amt, type,
    date:   new Date().toLocaleDateString()
  });

  $('walletAmount').value = '';
  persist(); renderWallet(); renderCreditProfile();
  toast(type === 'credit' ? `Deposited ${fmt(amt)}` : `Withdrew ${fmt(amt)}`, 'success');
}

$('depositBtn').addEventListener('click',  () => walletTransaction('credit'));
$('withdrawBtn').addEventListener('click', () => walletTransaction('debit'));

/** Calculate EMI using standard formula: P*r*(1+r)^n / ((1+r)^n - 1) */
function calcEMI(principal, annualRate, months) {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}

/** Live EMI preview as user fills loan form */
function updateEMIPreview() {
  const amt  = parseFloat($('loanAmount').value);
  const term = parseInt($('loanTerm').value);
  const rate = parseFloat($('loanRate').value);

  if (amt > 0 && term > 0 && rate > 0) {
    const emi      = calcEMI(amt, rate, term);
    const total    = emi * term;
    const interest = total - amt;
    $('previewEMI').textContent      = fmt(emi);
    $('previewTotal').textContent    = fmt(total);
    $('previewInterest').textContent = fmt(interest);
    $('emiPreview').style.display    = 'flex';
  } else {
    $('emiPreview').style.display = 'none';
  }
}

['loanAmount', 'loanTerm', 'loanRate'].forEach(id => $(id).addEventListener('input', updateEMIPreview));

/** Loan application with automated eligibility logic */
$('loanForm').addEventListener('submit', e => {
  e.preventDefault();
  const amount  = parseFloat($('loanAmount').value);
  const term    = parseInt($('loanTerm').value);
  const rate    = parseFloat($('loanRate').value);
  const purpose = $('loanPurpose').value;

  if (!amount || !term || !rate) { toast('Fill all required loan fields', 'error'); return; }

  const score     = renderCreditProfile();
  const totalDebt = state.loans.filter(l => l.status === 'active').reduce((s, l) => s + l.remaining, 0);
  const balance   = state.wallet.balance;

  // ── Eligibility Rules ──
  // Rule 1: Credit score must be >= 580
  if (score < 580) { toast('❌ Loan rejected: Credit score too low (' + score + ')', 'error'); return; }
  // Rule 2: Requested amount cannot exceed 5x wallet balance
  if (amount > balance * 5) { toast('❌ Loan rejected: Amount exceeds 5× your balance', 'error'); return; }
  // Rule 3: Total debt after this loan cannot exceed 3× balance
  if ((totalDebt + amount) > balance * 3 && balance > 0) { toast('❌ Loan rejected: Debt-to-balance ratio too high', 'error'); return; }
  // Rule 4: Max 3 active loans
  if (state.loans.filter(l => l.status === 'active').length >= 3) { toast('❌ Loan rejected: Maximum active loans reached', 'error'); return; }

  const emi = calcEMI(amount, rate, term);

  state.loans.unshift({
    id:        crypto.randomUUID(),
    amount, term, rate, purpose,
    emi:       parseFloat(emi.toFixed(2)),
    remaining: parseFloat((emi * term).toFixed(2)),
    paid:      0,
    status:    'active',
    created:   new Date().toLocaleDateString()
  });

  // Credit the loan amount to wallet
  state.wallet.balance += amount;
  state.wallet.transactions.push({ label: `Loan Disbursed (${purpose})`, amount, type: 'credit', date: new Date().toLocaleDateString() });

  persist(); renderWallet(); renderCreditProfile(); renderLoans();
  e.target.reset(); $('emiPreview').style.display = 'none';
  toast(`✅ Loan of ${fmt(amount)} approved!`, 'success');
});

/** Render active loans with repayment progress */
function renderLoans() {
  const list = $('loanList');
  const active = state.loans.filter(l => l.status === 'active');

  if (!active.length) { list.innerHTML = '<p class="empty-state">No active loans.</p>'; return; }

  list.innerHTML = active.map(loan => {
    const totalPayable = loan.emi * loan.term;
    const paidPct      = Math.min(100, (loan.paid / totalPayable) * 100).toFixed(1);
    return `
    <div class="loan-item" data-id="${loan.id}">
      <div class="loan-header">
        <span class="loan-title">💰 ${loan.purpose} Loan — ${fmt(loan.amount)}</span>
        <span class="badge badge-active">Active</span>
      </div>
      <div class="loan-progress-bar">
        <div class="loan-progress-fill" style="width:${paidPct}%"></div>
      </div>
      <div class="loan-stats">
        <div class="loan-stat"><span>Monthly EMI</span><strong>${fmt(loan.emi)}</strong></div>
        <div class="loan-stat"><span>Remaining</span><strong>${fmt(loan.remaining)}</strong></div>
        <div class="loan-stat"><span>Rate</span><strong>${loan.rate}% p.a.</strong></div>
        <div class="loan-stat"><span>Term</span><strong>${loan.term} mo.</strong></div>
        <div class="loan-stat"><span>Repaid</span><strong>${paidPct}%</strong></div>
      </div>
      <button class="pay-btn" data-id="${loan.id}">💳 Pay EMI (${fmt(loan.emi)})</button>
    </div>`;
  }).join('');

  list.querySelectorAll('.pay-btn').forEach(btn =>
    btn.addEventListener('click', () => payEMI(btn.dataset.id)));
}

/** Process one EMI payment */
function payEMI(id) {
  const loan = state.loans.find(l => l.id === id);
  if (!loan) return;

  if (state.wallet.balance < loan.emi) { toast('Insufficient balance to pay EMI', 'error'); return; }

  state.wallet.balance -= loan.emi;
  state.wallet.transactions.push({ label: `EMI Payment — ${loan.purpose}`, amount: loan.emi, type: 'debit', date: new Date().toLocaleDateString() });

  loan.paid      = parseFloat((loan.paid + loan.emi).toFixed(2));
  loan.remaining = parseFloat(Math.max(0, loan.remaining - loan.emi).toFixed(2));

  if (loan.remaining <= 0) {
    loan.status = 'closed';
    toast('🎉 Loan fully repaid!', 'success');
  } else {
    toast(`EMI paid. Remaining: ${fmt(loan.remaining)}`, 'success');
  }

  persist(); renderWallet(); renderCreditProfile(); renderLoans();
}

/* ================================================================
   MODULE 3 — FREELANCER INVOICE & CONTRACT GENERATOR
   ================================================================ */

/** Add a new blank line item row to the invoice builder */
function addLineItem(desc = '', qty = 1, rate = 0) {
  const container = $('lineItemsContainer');
  const row = document.createElement('div');
  row.className = 'line-item-row';
  row.innerHTML = `
    <input type="text"   class="li-desc" placeholder="Service description" value="${desc}" />
    <input type="number" class="li-qty"  placeholder="1"   min="1"   step="1"   value="${qty}" />
    <input type="number" class="li-rate" placeholder="0.00" min="0" step="0.01" value="${rate || ''}" />
    <span class="line-item-total">${fmt(qty * rate)}</span>
    <button type="button" class="remove-line" title="Remove">✕</button>`;

  // Recalculate totals on input change
  row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => {
    const q = parseFloat(row.querySelector('.li-qty').value)  || 0;
    const r = parseFloat(row.querySelector('.li-rate').value) || 0;
    row.querySelector('.line-item-total').textContent = fmt(q * r);
    calcInvoiceTotals();
  }));

  row.querySelector('.remove-line').addEventListener('click', () => {
    row.remove(); calcInvoiceTotals();
  });

  container.appendChild(row);
  calcInvoiceTotals();
}

$('addLineItem').addEventListener('click', () => addLineItem());

/** Recalculate subtotal, tax, and grand total */
function calcInvoiceTotals() {
  const rows     = $('lineItemsContainer').querySelectorAll('.line-item-row');
  const taxRate  = parseFloat($('invTax').value) || 0;
  let subtotal   = 0;

  rows.forEach(row => {
    const q = parseFloat(row.querySelector('.li-qty').value)  || 0;
    const r = parseFloat(row.querySelector('.li-rate').value) || 0;
    subtotal += q * r;
  });

  const taxAmt = subtotal * taxRate / 100;
  $('invSubtotal').textContent  = fmt(subtotal);
  $('invTaxAmt').textContent    = fmt(taxAmt);
  $('invGrandTotal').textContent = fmt(subtotal + taxAmt);
  $('taxRateDisplay').textContent = taxRate;
}

$('invTax').addEventListener('input', calcInvoiceTotals);

/** Collect current invoice form data into an object */
function collectInvoiceData() {
  const rows = [...$('lineItemsContainer').querySelectorAll('.line-item-row')];
  const taxRate = parseFloat($('invTax').value) || 0;

  const items = rows.map(row => ({
    desc: row.querySelector('.li-desc').value.trim(),
    qty:  parseFloat(row.querySelector('.li-qty').value)  || 0,
    rate: parseFloat(row.querySelector('.li-rate').value) || 0,
  })).filter(i => i.desc);

  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const taxAmt   = subtotal * taxRate / 100;

  return {
    number:         $('invNumber').value.trim(),
    date:           $('invDate').value,
    dueDate:        $('invDueDate').value,
    taxRate,
    clientName:     $('invClientName').value.trim(),
    clientEmail:    $('invClientEmail').value.trim(),
    freelancerName: $('invFreelancerName').value.trim(),
    items, subtotal, taxAmt,
    total:          subtotal + taxAmt,
  };
}

/** Save invoice to state */
$('saveInvoiceBtn').addEventListener('click', () => {
  const data = collectInvoiceData();
  if (!data.number || !data.clientName || !data.freelancerName || !data.date) {
    toast('Fill required invoice fields', 'error'); return;
  }
  if (!data.items.length) { toast('Add at least one line item', 'error'); return; }

  // Update existing or add new
  const idx = state.invoices.findIndex(i => i.number === data.number);
  if (idx >= 0) {
    state.invoices[idx] = { ...state.invoices[idx], ...data };
    toast('Invoice updated', 'info');
  } else {
    state.invoices.unshift({ ...data, id: crypto.randomUUID(), status: 'draft' });
    toast('Invoice saved', 'success');
  }

  persist(); renderInvoices();
});

/** Render saved invoices in sidebar */
function renderInvoices() {
  const list = $('invoiceList');
  if (!state.invoices.length) { list.innerHTML = '<p class="empty-state">No invoices saved yet.</p>'; return; }

  list.innerHTML = state.invoices.map(inv => `
    <div class="invoice-item">
      <div class="invoice-item-header">
        <span class="invoice-num">${inv.number}</span>
        <span class="badge badge-${inv.status}">${inv.status}</span>
      </div>
      <div class="invoice-client">${inv.clientName}</div>
      <div class="invoice-amount">${fmt(inv.total)}</div>
      <select class="invoice-status-select" data-id="${inv.id}">
        <option value="draft"   ${inv.status==='draft'   ?'selected':''}>Draft</option>
        <option value="sent"    ${inv.status==='sent'    ?'selected':''}>Sent</option>
        <option value="paid"    ${inv.status==='paid'    ?'selected':''}>Paid</option>
        <option value="overdue" ${inv.status==='overdue' ?'selected':''}>Overdue</option>
      </select>
      <div class="btn-row" style="margin-top:0.5rem;gap:0.4rem;">
        <button class="btn btn-sm btn-outline load-inv" data-id="${inv.id}">✏️ Edit</button>
        <button class="btn btn-sm btn-outline preview-inv" data-id="${inv.id}">👁 Preview</button>
        <button class="btn btn-sm btn-danger del-inv" data-id="${inv.id}" style="padding:0.25rem 0.5rem;">🗑</button>
      </div>
    </div>`).join('');

  // Status change
  list.querySelectorAll('.invoice-status-select').forEach(sel =>
    sel.addEventListener('change', () => {
      const inv = state.invoices.find(i => i.id === sel.dataset.id);
      if (inv) { inv.status = sel.value; persist(); renderInvoices(); toast('Status updated', 'info'); }
    }));

  // Load into editor
  list.querySelectorAll('.load-inv').forEach(btn =>
    btn.addEventListener('click', () => loadInvoiceIntoForm(btn.dataset.id)));

  // Preview contract
  list.querySelectorAll('.preview-inv').forEach(btn =>
    btn.addEventListener('click', () => {
      const inv = state.invoices.find(i => i.id === btn.dataset.id);
      if (inv) showContractModal(inv);
    }));

  // Delete
  list.querySelectorAll('.del-inv').forEach(btn =>
    btn.addEventListener('click', () => {
      state.invoices = state.invoices.filter(i => i.id !== btn.dataset.id);
      persist(); renderInvoices(); toast('Invoice deleted', 'info');
    }));
}

/** Load a saved invoice back into the builder form */
function loadInvoiceIntoForm(id) {
  const inv = state.invoices.find(i => i.id === id);
  if (!inv) return;

  $('invNumber').value         = inv.number;
  $('invDate').value           = inv.date;
  $('invDueDate').value        = inv.dueDate;
  $('invTax').value            = inv.taxRate;
  $('invClientName').value     = inv.clientName;
  $('invClientEmail').value    = inv.clientEmail;
  $('invFreelancerName').value = inv.freelancerName;

  $('lineItemsContainer').innerHTML = '';
  inv.items.forEach(item => addLineItem(item.desc, item.qty, item.rate));
  calcInvoiceTotals();
  toast('Invoice loaded into editor', 'info');
}

/** Preview contract button on builder */
$('previewContractBtn').addEventListener('click', () => {
  const data = collectInvoiceData();
  if (!data.number || !data.clientName) { toast('Fill invoice details first', 'error'); return; }
  showContractModal(data);
});

/** Build and show the contract modal */
function showContractModal(inv) {
  const itemRows = inv.items.map(i => `
    <tr>
      <td>${i.desc}</td>
      <td style="text-align:center">${i.qty}</td>
      <td style="text-align:right">${fmt(i.rate)}</td>
      <td style="text-align:right">${fmt(i.qty * i.rate)}</td>
    </tr>`).join('');

  $('contractPreview').innerHTML = `
    <div class="contract-header">
      <h2>SERVICE AGREEMENT & INVOICE</h2>
      <p>Invoice #${inv.number} &bull; Date: ${inv.date || 'N/A'} &bull; Due: ${inv.dueDate || 'N/A'}</p>
    </div>
    <div class="contract-parties">
      <div class="contract-party">
        <h4>Service Provider</h4>
        <p>${inv.freelancerName || '—'}</p>
      </div>
      <div class="contract-party">
        <h4>Client</h4>
        <p>${inv.clientName || '—'}</p>
        <p style="font-size:0.82rem;color:#666;">${inv.clientEmail || ''}</p>
      </div>
    </div>
    <table class="contract-table">
      <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="contract-totals">
      <p>Subtotal: <strong>${fmt(inv.subtotal)}</strong></p>
      <p>Tax (${inv.taxRate}%): <strong>${fmt(inv.taxAmt)}</strong></p>
      <p class="ct-grand">Total Due: ${fmt(inv.total)}</p>
    </div>
    <div class="contract-terms">
      <h4>Terms & Conditions</h4>
      <p>Payment is due within 30 days of invoice date. Late payments may incur a 1.5% monthly interest charge.
      All work remains the intellectual property of the service provider until full payment is received.
      This agreement is governed by applicable local laws.</p>
    </div>
    <div class="contract-signatures">
      <div><div class="sig-line">Service Provider Signature</div></div>
      <div><div class="sig-line">Client Signature & Date</div></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" id="closeModal">✕ Close</button>
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save PDF</button>
    </div>`;

  $('contractModal').style.display = 'flex';

  $('closeModal').addEventListener('click', closeModal);
  $('modalOverlay').addEventListener('click', closeModal);
}

function closeModal() { $('contractModal').style.display = 'none'; }

/* ================================================================
   APP INITIALIZATION — Run on page load
   ================================================================ */
(function init() {
  applyTheme();
  applyRole();          // sets role, renders expenses
  renderWallet();
  renderCreditProfile();
  renderLoans();
  // Add a default line item if invoice builder is empty
  if (!$('lineItemsContainer').children.length) addLineItem();
  renderInvoices();
  // Set today's date as default for expense and invoice forms
  const today = new Date().toISOString().split('T')[0];
  $('expDate').value  = today;
  $('invDate').value  = today;
})();
