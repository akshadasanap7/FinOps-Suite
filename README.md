# 💼 FinOps Suite — Corporate Finance & Freelance Operations

A fully client-side, single-page web application combining three core finance and operations modules built with **pure HTML5, CSS3, and Vanilla JavaScript** — no frameworks, no dependencies.

---

## 🚀 Live Modules

### 📊 1. Corporate Expense Tracker & Approval Workflow
- Employees submit expenses with title, category, amount, date, and receipt upload
- **Role switcher** toggles between Employee View and Manager/Admin View
- Managers can **Approve** or **Reject** expenses in real time
- Live dashboard stats: Total Submitted, Approved, Pending, and Rejected amounts
- All records persist across page refreshes via `localStorage`

### 🏦 2. Micro-Finance / P2P Lending Simulator
- Mock wallet with **Deposit** and **Withdraw** actions and a running transaction log
- **Credit score engine** (300–800) calculated dynamically from debt-to-balance ratio
- Loan application with **automated eligibility rules**:
  - Minimum credit score of 580
  - Loan amount cannot exceed 5× wallet balance
  - Total debt cannot exceed 3× wallet balance
  - Maximum 3 active loans at a time
- EMI calculated using the standard compound interest formula
- **Repayment tracker** with progress bar; loan closes automatically when fully paid

### 🧾 3. Freelancer Invoice & Contract Generator
- Dynamic line-item builder with live subtotal, tax, and grand total calculation
- Save, edit, and delete invoices with persistent state
- **Invoice status tracker**: Draft → Sent → Paid → Overdue (color-coded badges)
- One-click **print/PDF-ready contract preview** modal with service agreement terms and signature blocks

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Markup     | Semantic HTML5                      |
| Styling    | Modern CSS3 (Flexbox + Grid)        |
| Logic      | Vanilla JavaScript ES6+             |
| Persistence| Browser `localStorage`              |
| Fonts      | System UI / Segoe UI                |

> No React, No Bootstrap, No jQuery — zero external dependencies.

---

## 📁 Project Structure

```
FinOps-Suite/
├── index.html      # Semantic HTML structure for all 3 modules
├── styles.css      # Dark/light theme, responsive dashboard design
├── app.js          # Full state management & business logic
└── README.md
```

---

## ✨ Features

- 🌙 **Dark / Light theme** toggle with persistence
- 📱 **Fully responsive** layout (mobile, tablet, desktop)
- 🔔 **Toast notifications** for all user actions
- 🎨 **Status badges** — Green (Approved/Paid), Red (Rejected/Overdue), Yellow (Pending), Blue (Sent)
- 💾 **localStorage persistence** — data survives page refresh
- ♿ Semantic HTML with ARIA roles for accessibility
- 🖨️ **Print-ready** contract/invoice modal

---

## ⚙️ Getting Started

No build tools or installation required.

```bash
# Clone the repository
git clone https://github.com/akshadasanap7/FinOps-Suite.git

# Open in browser
cd FinOps-Suite
# Simply open index.html in any modern browser
```

Or just double-click `index.html` to run locally.

---

## 📸 Module Screenshots

| Module | Description |
|--------|-------------|
| Expense Tracker | Submit, review, approve/reject business expenses |
| P2P Lending | Wallet management, loan applications, EMI repayment |
| Invoice Generator | Line-item invoices, contract preview, status tracking |

---

## 📐 Business Logic Highlights

### EMI Formula
```
EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)

Where:
  P = Principal loan amount
  r = Monthly interest rate (annual rate / 12 / 100)
  n = Loan term in months
```

### Credit Score Calculation
```
Score = 800 - (debtRatio × 400) - (activeLoans × 15)
Clamped between 300 (Very Poor) and 800 (Excellent)
```

### Loan Eligibility Rules
```
✅ Credit score >= 580
✅ Loan amount <= 5 × wallet balance
✅ (Total debt + new loan) <= 3 × wallet balance
✅ Active loans < 3
```

---

## 👩‍💻 Author

**Akshada Sanap**
- GitHub: [@akshadasanap7](https://github.com/akshadasanap7)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
