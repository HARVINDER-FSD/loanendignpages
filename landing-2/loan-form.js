/**
 * Loan Lending Application & Single-Step Form Logic
 * Pure Static Frontend: Handles input masks, Plaid security indicators, 
 * live loan calculator, and form submission confirmation.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSingleStepForms();
  initInputMasks();
});

// Single-step loan application form submission
function initSingleStepForms() {
  const forms = document.querySelectorAll('.loan-application-form');

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Check browser validity
      if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        
        // Find first invalid input and focus
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus();
        }
        return;
      }

      form.classList.add('was-validated');

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHtml = submitBtn.innerHTML;

      // Realistic Plaid 256-bit encryption connection state
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Authenticating with Plaid 256-Bit SSL...
      `;

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;

        // Retrieve field values
        const firstName = form.querySelector('input[name="firstName"]')?.value || 'Applicant';
        const lastName = form.querySelector('input[name="lastName"]')?.value || '';
        const loanAmount = form.querySelector('input[name="requestedAmount"]')?.value || '10,000';
        const monthlyIncome = form.querySelector('input[name="monthlyIncome"]')?.value || '3,500';
        const institution = form.querySelector('input[name="institutionName"]')?.value || 'Chase Bank';
        const userEmail = form.querySelector('input[name="email"]')?.value || 'willsmiths987@gmail.com';

        // Update modal elements
        const modalRef = document.getElementById('confirmationModal');
        if (modalRef) {
          const confName = document.getElementById('confApplicantName');
          const confAmt = document.getElementById('confLoanAmount');
          const confInc = document.getElementById('confMonthlyIncome');
          const confBnk = document.getElementById('confBank');
          const confMail = document.getElementById('confEmail');
          const confId = document.getElementById('confAppId');

          if (confName) confName.textContent = `${firstName} ${lastName}`.trim();
          if (confAmt) confAmt.textContent = `$${parseFloat(loanAmount).toLocaleString()}`;
          if (confInc) confInc.textContent = `$${parseFloat(monthlyIncome).toLocaleString()}`;
          if (confBnk) confBnk.textContent = institution;
          if (confMail) confMail.textContent = userEmail;
          if (confId) confId.textContent = 'ADV-' + Math.floor(100000 + Math.random() * 900000);

          const bsModal = new bootstrap.Modal(modalRef);
          bsModal.show();
        } else {
          alert(`Application Successfully Received!\n\nReference: ADV-${Math.floor(100000 + Math.random() * 900000)}\nApplicant: ${firstName} ${lastName}\nLoan: $${loanAmount}\nBank: ${institution}\nReceipt dispatched to: ${userEmail}`);
        }

        // Reset form
        form.reset();
        form.classList.remove('was-validated');
      }, 1500);
    });
  });
}

// Input formatting helpers for Phone, SSN, DOB
function initInputMasks() {
  // Phone formatting: (555) 000-0000
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', (e) => {
      let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
      e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });
  });

  // SSN formatting: 9 digits masked
  document.querySelectorAll('.ssn-input').forEach(input => {
    input.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 9);
      if (val.length > 5) {
        e.target.value = val.substring(0, 3) + '-' + val.substring(3, 5) + '-' + val.substring(5, 9);
      } else if (val.length > 3) {
        e.target.value = val.substring(0, 3) + '-' + val.substring(3, 5);
      } else {
        e.target.value = val;
      }
    });
  });

  // Date of Birth formatting: MM/DD/YYYY
  document.querySelectorAll('.dob-input').forEach(input => {
    input.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 8);
      if (v.length >= 5) {
        e.target.value = `${v.slice(0,2)}/${v.slice(2,4)}/${v.slice(4)}`;
      } else if (v.length >= 3) {
        e.target.value = `${v.slice(0,2)}/${v.slice(2)}`;
      } else {
        e.target.value = v;
      }
    });
  });

  // Toggle password visibility
  document.querySelectorAll('.btn-toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          if (icon) icon.classList.replace('bi-eye', 'bi-eye-slash');
        } else {
          input.type = 'password';
          if (icon) icon.classList.replace('bi-eye-slash', 'bi-eye');
        }
      }
    });
  });
}
