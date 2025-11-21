const state = {
  users: [],
  branches: [],
  schemaFields: [],
  vendors: [],
  assignments: [],
  billings: [],
  integrations: [],
};

const pageType = document.body?.dataset?.page || 'login';
const activeRole = sessionStorage.getItem('vmsRole');
const activeUserId = sessionStorage.getItem('vmsUserId');

if (pageType === 'dashboard' && !activeRole) {
  window.location.href = 'index.html';
}

const storedUsers = (() => {
  try {
    return JSON.parse(localStorage.getItem('vmsUsers')) || [];
  } catch (error) {
    console.warn('Unable to parse user cache', error);
    return [];
  }
})();

if (storedUsers.length) {
  state.users.push(...storedUsers);
}

normalizeUsers();
ensureDefaultAdmin();

const validitySelect = document.querySelector('select[name="validityYears"]');
if (validitySelect) {
  for (let i = 1; i <= 10; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${i} year${i > 1 ? 's' : ''}`;
    validitySelect.appendChild(opt);
  }
}

const loginForm = document.getElementById('login-form');
const forgotPasswordBtn = document.getElementById('forgot-password');
const userForm = document.getElementById('user-form');
const userTableBody = document.querySelector('#user-table tbody');
const branchForm = document.getElementById('branch-form');
const branchList = document.getElementById('branch-list');
const fieldForm = document.getElementById('field-form');
const fieldList = document.getElementById('field-list');
const vendorForm = document.getElementById('vendor-form');
const verificationQueue = document.getElementById('verification-queue');
const renewalAlerts = document.getElementById('renewal-alerts');
const assignmentForm = document.getElementById('assignment-form');
const assignmentTable = document.querySelector('#assignment-table tbody');
const assignVendorSelect = document.getElementById('assignVendor');
const vendorSelfForm = document.getElementById('vendor-self-form');
const billingTable = document.querySelector('#billing-table tbody');
const apiForm = document.getElementById('api-form');
const integrationList = document.getElementById('integration-list');
const bulkUploadBtn = document.getElementById('bulk-upload');
const bulkFileInput = document.getElementById('bulk-file');
const yearSpan = document.getElementById('year');
const roleBadge = document.getElementById('active-role');
const logoutBtn = document.getElementById('logout');
const dataUploadForm = document.getElementById('data-upload-form');
const saveButtons = document.querySelectorAll('.save-continue');
const subNavButtons = document.querySelectorAll('.sub-nav-btn');
const lineItemsContainer = document.getElementById('billing-line-items');
const addLineBtn = document.getElementById('add-line-item');
const passwordModal = document.getElementById('password-modal');
const passwordForm = document.getElementById('password-change-form');
const passwordUserLabel = document.getElementById('password-user');
const activeUser = state.users.find(
  (user) => user.userId?.toLowerCase() === activeUserId?.toLowerCase()
);

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

if (roleBadge && activeRole) {
  roleBadge.textContent = activeRole;
}

renderUsers();
setupPageFlows();

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const then = new Date(dateStr);
  const diff = Date.now() - then.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function persistUsers() {
  localStorage.setItem('vmsUsers', JSON.stringify(state.users));
}

function normalizeUsers() {
  if (!state.users.length) return;
  const normalized = state.users.map((user) => ({
    ...user,
    userPermissions: Array.isArray(user.userPermissions)
      ? user.userPermissions
      : user.userPermissions
      ? [user.userPermissions]
      : [],
    mustChangePassword: user.mustChangePassword === false ? false : true,
  }));
  state.users.splice(0, state.users.length, ...normalized);
}

function ensureDefaultAdmin() {
  const hasAdmin = state.users.some(
    (user) => user.userRole && user.userRole.toLowerCase() === 'admin'
  );
  if (hasAdmin) return;
  const today = new Date().toISOString().split('T')[0];
  state.users.push({
    fullName: 'Platform Admin',
    userId: 'Admin',
    userRole: 'Admin',
    userPassword: 'Password',
    userBranch: 'Head Office',
    userBranchCode: 'HO001',
    userZone: 'Corporate',
    userEmail: 'admin@vendor-suite.com',
    userPermissions: ['Onboarding', 'Verification', 'Billing', 'Assignments', 'API'],
    userMobile: '9000000000',
    passwordReset: today,
    mustChangePassword: true,
  });
  persistUsers();
}

function renderUsers() {
  if (!userTableBody) return;
  userTableBody.innerHTML = '';
  state.users.forEach((user) => {
    const tr = document.createElement('tr');
    const days = daysSince(user.passwordReset);
    const permissions = Array.isArray(user.userPermissions)
      ? user.userPermissions
      : user.userPermissions
      ? [user.userPermissions]
      : [];
    const alert =
      days >= 90 ? '<span class="pill" style="background: rgba(255,79,100,0.2);color:var(--danger);">Rotate Now</span>' : 'Healthy';
    tr.innerHTML = `
      <td>${user.fullName || '-'}</td>
      <td>${user.userId || '-'}</td>
      <td>${formatBranchCell(user)}</td>
      <td>${user.userZone || '-'}</td>
      <td>${user.userEmail || '-'}</td>
      <td>${user.userRole || '-'}</td>
      <td>${permissions.length ? permissions.join(', ') : 'Not assigned'}</td>
      <td>${days} days</td>
      <td>${alert}</td>
    `;
    userTableBody.appendChild(tr);
  });
}

function formatBranchCell(user) {
  if (!user || !user.userBranch) return '-';
  const code = user.userBranchCode ? ` (${user.userBranchCode})` : '';
  return `${user.userBranch}${code}`;
}

function renderBranches() {
  if (!branchList) return;
  branchList.innerHTML = '';
  state.branches.forEach((branch) => {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = `${branch.branchCode} · ${branch.branchName} (${branch.branchState})`;
    branchList.appendChild(pill);
  });
}

function renderFields() {
  if (!fieldList) return;
  fieldList.innerHTML = '';
  state.schemaFields.forEach((field) => {
    const li = document.createElement('li');
    const options = field.fieldOptions ? ` · Options: ${field.fieldOptions}` : '';
    li.textContent = `${field.fieldLabel} (${field.fieldType})${options}`;
    fieldList.appendChild(li);
  });
}

function renderVendors() {
  if (!verificationQueue) return;
  verificationQueue.innerHTML = '';
  state.vendors
    .filter((v) => v.status !== 'Approved')
    .forEach((vendor) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-header">
          <span>${vendor.vendorName} (${vendor.vendorType})</span>
          <span>${vendor.validityYears} yr</span>
        </div>
        <p>Documents: ${vendor.documentNames || 'Not listed'}</p>
        <p>Zone: ${vendor.vendorZone} · Mobile: ${vendor.vendorMobile}</p>
        <div class="card-actions">
          <button class="primary" data-action="approve" data-id="${vendor.id}">
            Approve & Generate Code
          </button>
          <button class="ghost" data-action="query" data-id="${vendor.id}">
            Raise Query
          </button>
        </div>
      `;
      verificationQueue.appendChild(card);
    });
  updateAssignVendorOptions();
  renderRenewalAlerts();
}

function renderRenewalAlerts() {
  if (!renewalAlerts) return;
  renewalAlerts.innerHTML = '';
  state.vendors
    .filter((v) => v.status === 'Approved')
    .forEach((vendor) => {
      const li = document.createElement('li');
      const expDate = new Date(vendor.validTill);
      const today = new Date();
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      const badge =
        diffDays <= 30
          ? `<span class="pill" style="background: rgba(255,159,26,0.2);color:var(--warning);">Due in ${diffDays}d</span>`
          : `<span class="pill" style="background: rgba(15,169,88,0.15);color:var(--success);">Valid</span>`;
      li.innerHTML = `<strong>${vendor.vendorName}</strong> · Valid till ${expDate
        .toISOString()
        .split('T')[0]} ${badge}`;
      renewalAlerts.appendChild(li);
    });
}

function renderAssignments() {
  if (!assignmentTable) return;
  assignmentTable.innerHTML = '';
  state.assignments.forEach((assign) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${assign.caseId}</td>
      <td>${assign.department}</td>
      <td>${assign.assignVendor}</td>
      <td>${assign.assignMode}</td>
    `;
    assignmentTable.appendChild(tr);
  });
}

function renderBilling() {
  if (!billingTable) return;
  billingTable.innerHTML = '';
  state.billings.forEach((bill) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${bill.billingMonth || '-'}</td>
      <td>${formatInvoiceCell(bill)}</td>
      <td>${bill.selfVendorCode || '-'}</td>
      <td>${bill.billingRate || '-'}</td>
      <td>${bill.gstCharge || '-'}</td>
      <td>${bill.lineItems ? bill.lineItems.length : 0}</td>
      <td>${bill.paymentStatus}</td>
    `;
    billingTable.appendChild(tr);
  });
}

function formatInvoiceCell(bill) {
  if (!bill) return '-';
  const number = bill.invoiceNumber || '-';
  const date = bill.invoiceDate || '';
  return date ? `${number}<br><small>${date}</small>` : number;
}

function renderIntegrations() {
  if (!integrationList) return;
  integrationList.innerHTML = '';
  state.integrations.forEach((integration) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${integration.integrationName}</strong> · ${
      integration.integrationAuth
    } · <a href="${integration.integrationUrl}" target="_blank">${integration.integrationUrl}</a>`;
    integrationList.appendChild(li);
  });
}

function updateAssignVendorOptions() {
  if (!assignVendorSelect) return;
  assignVendorSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select approved vendor';
  assignVendorSelect.appendChild(placeholder);
  state.vendors
    .filter((v) => v.status === 'Approved')
    .forEach((vendor) => {
      const opt = document.createElement('option');
      opt.value = vendor.vendorCode;
      opt.textContent = `${vendor.vendorCode} · ${vendor.vendorName}`;
      assignVendorSelect.appendChild(opt);
    });
}

function generateVendorCode() {
  let code;
  do {
    code = Math.floor(10000 + Math.random() * 90000).toString();
  } while (state.vendors.some((v) => v.vendorCode === code));
  return code;
}

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const role = formData.get('role');
  const userId = formData.get('userId');
  const password = formData.get('password');
  const targetUser = state.users.find(
    (user) => user.userId?.toLowerCase() === userId.toLowerCase()
  );
  if (targetUser) {
    if (targetUser.userPassword && targetUser.userPassword !== password) {
      alert('Incorrect password. Please try again.');
      return;
    }
    if (
      targetUser.userRole &&
      targetUser.userRole.toLowerCase() !== role.toLowerCase()
    ) {
      alert('Selected role does not match assigned permissions.');
      return;
    }
    sessionStorage.setItem('vmsRole', targetUser.userRole || role);
    sessionStorage.setItem('vmsUserId', targetUser.userId || '');
    
    // Route to appropriate dashboard based on role
    const roleLower = (targetUser.userRole || role).toLowerCase();
    if (roleLower === 'admin') {
      window.location.href = 'admin.html';
    } else if (roleLower === 'maker') {
      window.location.href = 'maker.html';
    } else if (roleLower === 'vendor') {
      window.location.href = 'vendor.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  } else {
    alert('User not registered. Please contact the Admin.');
  }
});

forgotPasswordBtn?.addEventListener('click', () => {
  alert('Please contact the system administrator to reset your credentials.');
});

userForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(userForm);
  const permissions = formData.getAll('userPermissions');
  const payload = {
    fullName: formData.get('fullName'),
    userBranch: formData.get('userBranch'),
    userBranchCode: formData.get('userBranchCode'),
    userZone: formData.get('userZone'),
    userEmail: formData.get('userEmail'),
    userMobile: formData.get('userMobile'),
    userId: formData.get('userId'),
    userPassword: formData.get('userPassword'),
    userRole: formData.get('userRole'),
    passwordReset: formData.get('passwordReset'),
    userPermissions: permissions,
    mustChangePassword: true,
  };
  const exists = state.users.find(
    (user) => user.userId?.toLowerCase() === payload.userId.toLowerCase()
  );
  if (exists) {
    payload.mustChangePassword = true;
    Object.assign(exists, payload);
  } else {
    state.users.push(payload);
  }
  userForm.reset();
  renderUsers();
  persistUsers();
});

branchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(branchForm));
  state.branches.push(formData);
  branchForm.reset();
  renderBranches();
});

fieldForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(fieldForm));
  state.schemaFields.push(formData);
  fieldForm.reset();
  renderFields();
});

vendorForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(vendorForm));
  const id = crypto.randomUUID();
  const today = new Date();
  const vendor = {
    ...formData,
    id,
    status: 'Pending',
    validTill: new Date(
      today.setFullYear(today.getFullYear() + Number(formData.validityYears))
    ).toISOString(),
  };
  state.vendors.push(vendor);
  vendorForm.reset();
  renderVendors();
  alert('Vendor submitted. Awaiting verification.');
});

verificationQueue?.addEventListener('click', (event) => {
  const button = event.target;
  if (button.tagName !== 'BUTTON') return;
  const id = button.dataset.id;
  const vendor = state.vendors.find((v) => v.id === id);
  if (!vendor) return;
  if (button.dataset.action === 'approve') {
    vendor.status = 'Approved';
    vendor.vendorCode = generateVendorCode();
    renderVendors();
    alert(`Vendor approved. Secure code ${vendor.vendorCode}`);
  }
  if (button.dataset.action === 'query') {
    vendor.status = 'Query';
    renderVendors();
    alert('Query sent to maker for rectification.');
  }
});

assignmentForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(assignmentForm));
  state.assignments.push(formData);
  assignmentForm.reset();
  renderAssignments();
});

vendorSelfForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(vendorSelfForm);
  const lineItems = collectLineItems();
  if (!lineItems.length) {
    alert('Please add at least one billing line with description and amount.');
    return;
  }
  const payload = {
    billingMonth: formData.get('billingMonth'),
    invoiceNumber: formData.get('invoiceNumber'),
    invoiceDate: formData.get('invoiceDate'),
    selfVendorCode: formData.get('selfVendorCode'),
    billingRate: formData.get('billingRate'),
    selfGST: formData.get('selfGST'),
    gstCharge: formData.get('gstCharge'),
    billingNotes: formData.get('billingNotes'),
    paymentStatus: formData.get('paymentStatus'),
    lineItems,
  };
  const exists = state.billings.find(
    (bill) =>
      bill.selfVendorCode === payload.selfVendorCode &&
      bill.invoiceNumber === payload.invoiceNumber
  );
  if (exists) {
    Object.assign(exists, payload);
  } else {
    state.billings.push(payload);
  }
  vendorSelfForm.reset();
  resetLineItems();
  renderBilling();
});

apiForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(apiForm));
  state.integrations.push(formData);
  apiForm.reset();
  renderIntegrations();
});

bulkUploadBtn?.addEventListener('click', () => {
  bulkFileInput?.click();
});

bulkFileInput?.addEventListener('change', () => {
  if (!bulkFileInput.files.length) return;
  alert(
    `Bulk onboarding file (${bulkFileInput.files[0].name}) received for Legal/Technical/PD/FI/FCU/RCU evaluation.`
  );
  bulkFileInput.value = '';
});

function setupPageFlows() {
  if (saveButtons.length) {
    saveButtons.forEach((button) =>
      button.addEventListener('click', handleSaveAndContinue)
    );
  }
  if (subNavButtons.length) {
    subNavButtons.forEach((btn) =>
      btn.addEventListener('click', () => focusSection(btn.dataset.target))
    );
    activateSubNav(subNavButtons[0]?.dataset.target);
  }
  dataUploadForm?.addEventListener('submit', handleDataUpload);
  if (lineItemsContainer) {
    if (!lineItemsContainer.children.length) {
      addLineItemRow();
    }
    lineItemsContainer.addEventListener('click', handleLineItemClick);
  }
  addLineBtn?.addEventListener('click', () => addLineItemRow());
  if (pageType === 'dashboard' && passwordModal && passwordForm && activeUser) {
    if (passwordUserLabel) {
      passwordUserLabel.textContent =
        activeUser.fullName || activeUser.userId || 'User';
    }
    if (activeUser.mustChangePassword !== false) {
      passwordModal.classList.remove('hidden');
    }
    passwordForm.addEventListener('submit', handlePasswordChange);
  }
}

function handleSaveAndContinue(event) {
  const button = event.currentTarget;
  const parentForm = button.closest('form');
  if (parentForm) {
    if (!parentForm.reportValidity()) return;
    parentForm.requestSubmit();
  }
  focusSection(button.dataset.next);
}

function focusSection(targetSelector) {
  if (!targetSelector) return;
  const target = document.querySelector(targetSelector);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activateSubNav(targetSelector);
  }
}

function activateSubNav(targetSelector) {
  if (!subNavButtons.length || !targetSelector) return;
  const hasMatch = Array.from(subNavButtons).some(
    (btn) => btn.dataset.target === targetSelector
  );
  if (!hasMatch) return;
  subNavButtons.forEach((btn) =>
    btn.classList.toggle('active', btn.dataset.target === targetSelector)
  );
}

function handleDataUpload(event) {
  event.preventDefault();
  const fileInput = dataUploadForm.querySelector('input[name="adminUpload"]');
  const file = fileInput?.files?.[0];
  if (!file) {
    alert('Please select a file to upload.');
    return;
  }
  const notes = dataUploadForm.uploadNotes?.value || 'No notes provided';
  alert(
    `File ${file.name} submitted for secure migration.\nNotes: ${notes}`
  );
  dataUploadForm.reset();
}

function addLineItemRow(values = {}) {
  if (!lineItemsContainer) return;
  const row = document.createElement('div');
  row.className = 'line-item';

  const desc = document.createElement('input');
  desc.type = 'text';
  desc.className = 'line-desc';
  desc.placeholder = 'Line description';
  desc.required = true;
  desc.value = values.description || '';

  const amount = document.createElement('input');
  amount.type = 'number';
  amount.className = 'line-amt';
  amount.placeholder = 'Amount';
  amount.min = '0';
  amount.step = '0.01';
  amount.required = true;
  amount.value =
    typeof values.amount === 'number' && !Number.isNaN(values.amount)
      ? values.amount
      : '';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'icon-btn remove-line';
  removeBtn.innerHTML = '&times;';
  removeBtn.title = 'Remove line';

  row.append(desc, amount, removeBtn);
  lineItemsContainer.appendChild(row);
}

function handleLineItemClick(event) {
  if (!event.target.classList.contains('remove-line')) return;
  const row = event.target.closest('.line-item');
  if (!row) return;
  if (lineItemsContainer.children.length === 1) {
    row.querySelectorAll('input').forEach((input) => (input.value = ''));
    return;
  }
  row.remove();
}

function resetLineItems(lineItems = []) {
  if (!lineItemsContainer) return;
  lineItemsContainer.innerHTML = '';
  if (!lineItems.length) {
    addLineItemRow();
  } else {
    lineItems.forEach((item) => addLineItemRow(item));
  }
}

function collectLineItems() {
  if (!lineItemsContainer) return [];
  const rows = Array.from(lineItemsContainer.querySelectorAll('.line-item'));
  return rows
    .map((row) => {
      const description = row.querySelector('.line-desc')?.value.trim() || '';
      const amountValue = row.querySelector('.line-amt')?.value || '';
      const amount = parseFloat(amountValue);
      if (!description || Number.isNaN(amount) || amount <= 0) return null;
      return { description, amount };
    })
    .filter(Boolean);
}

function handlePasswordChange(event) {
  event.preventDefault();
  const newPassword = passwordForm.newPassword.value.trim();
  const confirmPassword = passwordForm.confirmPassword.value.trim();
  if (newPassword.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }
  if (newPassword !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }
  if (activeUser) {
    activeUser.userPassword = newPassword;
    activeUser.mustChangePassword = false;
    activeUser.passwordReset = new Date().toISOString().split('T')[0];
    persistUsers();
  }
  passwordModal.classList.add('hidden');
  passwordForm.reset();
  alert('Password updated successfully.');
}

logoutBtn?.addEventListener('click', () => {
  sessionStorage.removeItem('vmsRole');
  sessionStorage.removeItem('vmsUserId');
  window.location.href = 'index.html';
});

// PIN to State mapping (simplified - in production, use a proper API)
const pinToStateMap = {
  '110001': 'Delhi', '400001': 'Maharashtra', '600001': 'Tamil Nadu',
  '700001': 'West Bengal', '560001': 'Karnataka', '380001': 'Gujarat',
  '302001': 'Rajasthan', '500001': 'Telangana', '110092': 'Delhi',
  '400051': 'Maharashtra', '600032': 'Tamil Nadu', '700016': 'West Bengal'
};

// Auto-populate state from PIN code
document.addEventListener('input', (e) => {
  if (e.target.name === 'pinCode' && e.target.value.length === 6) {
    const pin = e.target.value;
    const stateInput = document.getElementById('stateName');
    if (stateInput && pinToStateMap[pin]) {
      stateInput.value = pinToStateMap[pin];
    }
  }
});

// Dynamic submenu options
const menuSubmenuMap = {
  admin: ['Add User', 'Add Vendor', 'Create User Permission', 'Reset Password', 'Add Data from Excel', 'Vendor Onboarding', 'Bill Payment & UTR', 'Add Dynamic Fields'],
  maker: ['Vendor Onboarding', 'Submit Manual Assign Cases', 'Verify Bill', 'Sent Back'],
  vendor: ['Input Rate', 'Generate Bill', 'Submit NDC', 'Bill Status']
};

const menuSelect = document.getElementById('menuSelect');
const subMenuSelect = document.getElementById('subMenuSelect');

if (menuSelect && subMenuSelect) {
  menuSelect.addEventListener('change', () => {
    const selectedMenu = menuSelect.value;
    subMenuSelect.innerHTML = '<option value="">Select Sub-Menu</option>';
    if (menuSubmenuMap[selectedMenu]) {
      menuSubmenuMap[selectedMenu].forEach(submenu => {
        const opt = document.createElement('option');
        opt.value = submenu.toLowerCase().replace(/\s+/g, '-');
        opt.textContent = submenu;
        subMenuSelect.appendChild(opt);
      });
    }
  });
}

// Initialize page-specific handlers
const currentPage = document.body?.dataset?.page || '';

if (currentPage === 'admin-add-user' || currentPage === 'admin-add-vendor' || currentPage === 'maker-vendor-onboarding') {
  const validitySelect = document.querySelector('select[name="validityYears"]');
  if (validitySelect) {
    for (let i = 1; i <= 10; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${i} year${i > 1 ? 's' : ''}`;
      validitySelect.appendChild(opt);
    }
  }
}

if (currentPage === 'vendor-generate-bill') {
  const vendorCodeInput = document.getElementById('vendor-code-input');
  const activeVendorCode = sessionStorage.getItem('vendorCode');
  if (vendorCodeInput && activeVendorCode) {
    vendorCodeInput.value = activeVendorCode;
  }
}

if (currentPage === 'vendor-bill-status') {
  const searchBillsBtn = document.getElementById('search-bills');
  const showPaidBillsBtn = document.getElementById('show-paid-bills');
  const billStatusTable = document.querySelector('#bill-status-table tbody');
  
  if (searchBillsBtn) {
    searchBillsBtn.addEventListener('click', () => {
      const dateFrom = document.getElementById('dateFrom').value;
      const dateTo = document.getElementById('dateTo').value;
      const statusFilter = document.getElementById('statusFilter').value;
      const vendorCode = sessionStorage.getItem('vendorCode');
      
      // Filter bills based on criteria
      const filteredBills = state.billings.filter(bill => {
        if (vendorCode && bill.selfVendorCode !== vendorCode) return false;
        if (statusFilter && bill.paymentStatus !== statusFilter) return false;
        if (dateFrom && bill.invoiceDate < dateFrom) return false;
        if (dateTo && bill.invoiceDate > dateTo) return false;
        return true;
      });
      
      renderBillStatusTable(filteredBills);
    });
  }
  
  if (showPaidBillsBtn) {
    showPaidBillsBtn.addEventListener('click', () => {
      const vendorCode = sessionStorage.getItem('vendorCode');
      const paidBills = state.billings.filter(bill => {
        if (vendorCode && bill.selfVendorCode !== vendorCode) return false;
        return bill.paymentStatus === 'Paid' && bill.utrNumber;
      });
      renderBillStatusTable(paidBills);
    });
  }
  
  function renderBillStatusTable(bills) {
    if (!billStatusTable) return;
    billStatusTable.innerHTML = '';
    bills.forEach(bill => {
      const tr = document.createElement('tr');
      const total = (parseFloat(bill.billingRate) || 0) + (parseFloat(bill.gstCharge) || 0);
      tr.innerHTML = `
        <td>${bill.invoiceNumber || '-'}</td>
        <td>${bill.invoiceDate || '-'}</td>
        <td>${bill.billingMonth || '-'}</td>
        <td>${bill.billingRate || '0'}</td>
        <td>${bill.gstCharge || '0'}</td>
        <td>${total.toFixed(2)}</td>
        <td>${bill.paymentStatus || 'Pending'}</td>
        <td>${bill.utrNumber || '-'}</td>
        <td>${bill.paymentDate || '-'}</td>
      `;
      billStatusTable.appendChild(tr);
    });
  }
}

// Role-based access control
if (pageType !== 'login' && !activeRole) {
  window.location.href = 'index.html';
}

// Check if user has access to current page
// Admin has access to all panels and pages
if (activeRole && activeRole.toLowerCase() !== 'admin') {
  const roleLower = activeRole.toLowerCase();
  const restrictedPages = {
    'maker': ['admin', 'admin-add-user', 'admin-add-vendor', 'admin-permissions', 
      'admin-reset-password', 'admin-excel-upload', 'admin-vendor-onboarding', 
      'admin-bill-payment', 'admin-dynamic-fields', 'vendor', 'vendor-input-rate',
      'vendor-generate-bill', 'vendor-submit-ndc', 'vendor-bill-status'],
    'vendor': ['admin', 'admin-add-user', 'admin-add-vendor', 'admin-permissions', 
      'admin-reset-password', 'admin-excel-upload', 'admin-vendor-onboarding', 
      'admin-bill-payment', 'admin-dynamic-fields', 'maker', 'maker-vendor-onboarding',
      'maker-manual-assign', 'maker-verify-bill', 'maker-sent-back', 'maker-reset-password']
  };
  
  const userRestrictedPages = restrictedPages[roleLower] || [];
  if (userRestrictedPages.includes(currentPage)) {
    alert('Access denied. You do not have permission to access this page.');
    if (roleLower === 'maker') {
      window.location.href = 'maker.html';
    } else if (roleLower === 'vendor') {
      window.location.href = 'vendor.html';
    } else {
      window.location.href = 'index.html';
    }
  }
}

renderBranches();
renderFields();
renderVendors();
renderAssignments();
renderBilling();
renderIntegrations();

