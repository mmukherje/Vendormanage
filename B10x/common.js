// Common functions for all pages
function loadLogo() {
  const logoElements = document.querySelectorAll('.brand-logo, .nav-logo');
  
  // List of possible logo file paths in order of preference
  const logoPaths = [
    'assets/company-logo/janalogo.png.png',  // Actual file name
    'assets/company-logo/janalogo.png',
    'assets/company-logo/logo.png',
    'assets/company-logo/logo.jpg',
    'assets/company-logo/logo.svg',
    'assets/company-logo/logo-placeholder.svg'
  ];
  
  logoElements.forEach(img => {
    let logoFound = false;
    let currentIndex = 0;
    
    function tryNextLogo() {
      if (currentIndex >= logoPaths.length) {
        // All logos tried, hide the image
        img.style.display = 'none';
        return;
      }
      
      const logoPath = logoPaths[currentIndex];
      const testImg = new Image();
      
      testImg.onload = function() {
        if (!logoFound) {
          img.src = logoPath;
          img.style.display = 'block';
          logoFound = true;
        }
      };
      
      testImg.onerror = function() {
        currentIndex++;
        tryNextLogo();
      };
      
      testImg.src = logoPath;
    }
    
    // Start trying logos
    tryNextLogo();
  });
}

// Generate banking-style navigation based on user role
function generateBankingNav(activePage = '') {
  const activeRole = sessionStorage.getItem('vmsRole') || '';
  const activeUserId = sessionStorage.getItem('vmsUserId') || '';
  const isAdmin = activeRole.toLowerCase() === 'admin';
  
  // Get current page name for active state
  const currentPage = document.body?.dataset?.page || '';
  
  let navHTML = `
    <nav class="banking-nav">
      <div class="nav-top">
        <div class="nav-brand">
          <img src="assets/company-logo/janalogo.png.png" alt="Company Logo" class="nav-logo" onerror="this.src='assets/company-logo/logo-placeholder.svg'; this.onerror=function(){this.style.display='none';}" />
          <div class="nav-brand-text">
            <h2>Vendor Management Software</h2>
          </div>
        </div>
        <div class="nav-user-info">
          <span class="user-name">${activeUserId || activeRole}</span>
          <button id="logout" class="nav-logout-btn">Logout</button>
        </div>
      </div>
      <div class="nav-menu-bar">
  `;
  
  // Admin sees all menus
  if (isAdmin) {
    navHTML += `
      <div class="nav-menu-item">
        <a href="admin.html" class="nav-menu-link ${currentPage.startsWith('admin') ? 'active' : ''}">Admin</a>
        <div class="nav-dropdown">
          <a href="admin-add-user.html">Add User</a>
          <a href="admin-add-vendor.html">Add Vendor</a>
          <a href="admin-permissions.html">Create User Permission</a>
          <a href="admin-reset-password.html">Reset Password</a>
          <a href="admin-excel-upload.html">Add Data from Excel</a>
          <a href="admin-vendor-onboarding.html">Vendor Onboarding</a>
          <a href="admin-bill-payment.html">Bill Payment & UTR</a>
          <a href="admin-dynamic-fields.html">Add Dynamic Fields</a>
        </div>
      </div>
      <div class="nav-menu-item">
        <a href="maker.html" class="nav-menu-link ${currentPage.startsWith('maker') ? 'active' : ''}">Maker</a>
        <div class="nav-dropdown">
          <a href="maker-vendor-onboarding.html">Vendor Onboarding</a>
          <a href="maker-manual-assign.html">Submit Manual Assign Cases</a>
          <a href="maker-verify-bill.html">Verify Bill</a>
          <a href="maker-sent-back.html">Sent Back Cases</a>
        </div>
      </div>
      <div class="nav-menu-item">
        <a href="vendor.html" class="nav-menu-link ${currentPage.startsWith('vendor') ? 'active' : ''}">Vendor</a>
        <div class="nav-dropdown">
          <a href="vendor-input-rate.html">Input Rate</a>
          <a href="vendor-generate-bill.html">Generate Bill</a>
          <a href="vendor-submit-ndc.html">Submit NDC</a>
          <a href="vendor-bill-status.html">Bill Status</a>
        </div>
      </div>
    `;
  } else if (activeRole.toLowerCase() === 'maker') {
    navHTML += `
      <div class="nav-menu-item">
        <a href="maker.html" class="nav-menu-link ${currentPage.startsWith('maker') ? 'active' : ''}">Maker</a>
        <div class="nav-dropdown">
          <a href="maker-vendor-onboarding.html">Vendor Onboarding</a>
          <a href="maker-manual-assign.html">Submit Manual Assign Cases</a>
          <a href="maker-verify-bill.html">Verify Bill</a>
          <a href="maker-sent-back.html">Sent Back Cases</a>
        </div>
      </div>
    `;
  } else if (activeRole.toLowerCase() === 'vendor') {
    navHTML += `
      <div class="nav-menu-item">
        <a href="vendor.html" class="nav-menu-link ${currentPage.startsWith('vendor') ? 'active' : ''}">Vendor</a>
        <div class="nav-dropdown">
          <a href="vendor-input-rate.html">Input Rate</a>
          <a href="vendor-generate-bill.html">Generate Bill</a>
          <a href="vendor-submit-ndc.html">Submit NDC</a>
          <a href="vendor-bill-status.html">Bill Status</a>
        </div>
      </div>
    `;
  }
  
  navHTML += `
      </div>
    </nav>
  `;
  
  return navHTML;
}

// Initialize logo on page load
document.addEventListener('DOMContentLoaded', function() {
  loadLogo();
  
  // Replace old nav with banking nav if old nav exists
  const oldNav = document.querySelector('.main-nav');
  if (oldNav && !document.querySelector('.banking-nav')) {
    const navHTML = generateBankingNav();
    oldNav.outerHTML = navHTML;
    loadLogo(); // Reload logo after nav replacement
  }
  
  // Setup logout button
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      sessionStorage.clear();
      window.location.href = 'index.html';
    });
  }
});

