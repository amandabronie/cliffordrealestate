/* =========================================================
   Harbour & Vine Realty — Rental Application Form
   ========================================================= */

const CONFIG = {
  COMPANY: "Harbour & Vine Realty",
  AGENT: "Daniel Mercer",
  OWNER_EMAIL: "daniel@harbourandvine.com",
  EMAILJS_PUBLIC_KEY: "",
  EMAILJS_SERVICE_ID: "",
  EMAILJS_TEMPLATE_ID: "",
  OFFER_VISITOR_COPY: true,
};

/* ---------- Helpers ---------- */
function pdfSafe(value) {
  return String(value ?? "")
    .replace(/₦/g, "NGN ")
    .replace(/[—–]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x00-\xFF]/g, "")
    .trim();
}

function timestamp() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

/* ---------- Collect Form Data ---------- */
function collectData(form) {
  const fd = new FormData(form);
  const get = (k) => (fd.get(k) || "").toString().trim();

  const employment =
    form.querySelector('input[name="employment"]:checked')?.value ||
    "Not specified";
  const payment =
    form.querySelector('input[name="payment"]:checked')?.value ||
    "Not specified";

  return {
    propertyAddress: get("propertyAddress"),
    viewingDate: get("viewingDate") || "Not specified",
    moveInDate: get("moveInDate") || "Not specified",
    firstName: get("firstName"),
    lastName: get("lastName"),
    dob: get("dob") || "Not specified",
    tenantEmail: get("tenantEmail"),
    phone: get("phone"),
    employment,
    payment,
    comments: get("comments") || "None",
    declarationAgree: form.querySelector("#declarationAgree").checked
      ? "Yes"
      : "No",
    submittedAt: timestamp(),
  };
}

/* ---------- Text Summary ---------- */
function buildTextSummary(d) {
  return [
    `NEW RENTAL APPLICATION — ${CONFIG.COMPANY}`,
    `Submitted: ${d.submittedAt}`,
    "",
    `Property:      ${d.propertyAddress}`,
    `Viewing Date:  ${d.viewingDate}`,
    `Move-in Date:  ${d.moveInDate}`,
    "",
    `Name:          ${d.firstName} ${d.lastName}`,
    `Email:         ${d.tenantEmail}`,
    `Phone:         ${d.phone}`,
    `DOB:           ${d.dob}`,
    "",
    `Employment:    ${d.employment}`,
    `Payment:       ${d.payment}`,
    `Declaration:   Agreed (${d.declarationAgree})`,
    "",
    "Comments:",
    d.comments,
    "",
    "---",
    `Reply directly to this email to reach ${d.firstName}.`,
  ].join("\n");
}

/* ---------- PDF Generation ---------- */
function buildPdf(d, signatureDataUrl) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 18;
  let y = 0;

  /* Header */
  doc.setFillColor(15, 20, 24);
  doc.rect(0, 0, PW, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(pdfSafe(CONFIG.COMPANY), M, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(178, 188, 198);
  doc.text(pdfSafe(CONFIG.OWNER_EMAIL), M, 22);
  doc.setFontSize(9);
  doc.text("RENTAL APPLICATION", PW - M, 16, { align: "right" });

  /* Title */
  y = 50;
  doc.setTextColor(16, 20, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("Rental Application", M, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(107, 116, 128);
  doc.text(`Submitted ${pdfSafe(d.submittedAt)}`, M, y);
  y += 5;
  doc.setDrawColor(227, 230, 234);
  doc.line(M, y, PW - M, y);
  y += 13;

  /* Helper to add rows */
  const addRow = (label, value) => {
    if (!value || value === "Not specified") return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 116, 128);
    doc.text(label.toUpperCase(), M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(16, 20, 24);
    const lines = doc.splitTextToSize(pdfSafe(value), PW - M * 2);
    let yy = y + 6;
    lines.forEach((line) => {
      doc.text(line, M, yy);
      yy += 5.6;
    });
    y = yy + 5;
  };

  /* Property Details */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(16, 20, 24);
  doc.text("PROPERTY DETAILS", M, y);
  y += 8;
  addRow("Property Address", d.propertyAddress);
  addRow("Preferred Viewing", d.viewingDate);
  addRow("Move-in Date", d.moveInDate);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PERSONAL DETAILS", M, y);
  y += 8;
  addRow("Full Name", `${d.firstName} ${d.lastName}`);
  addRow("Email", d.tenantEmail);
  addRow("Phone", d.phone);
  addRow("Date of Birth", d.dob);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("EMPLOYMENT & PAYMENT", M, y);
  y += 8;
  addRow("Employment Status", d.employment);
  addRow("Payment Method", d.payment);
  addRow("Declaration Agreed", d.declarationAgree);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("COMMENTS", M, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const commentLines = doc.splitTextToSize(pdfSafe(d.comments), PW - M * 2);
  commentLines.forEach((line) => {
    doc.text(line, M, y);
    y += 5.8;
  });

  /* Signature */
  if (signatureDataUrl) {
    y += 10;
    doc.setDrawColor(227, 230, 234);
    doc.line(M, y, PW - M, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 116, 128);
    doc.text("SIGNATURE", M, y);
    y += 4;
    // Add the signature image
    try {
      doc.addImage(signatureDataUrl, "PNG", M, y, 60, 25);
      y += 30;
    } catch (e) {
      console.warn("Could not add signature to PDF", e);
    }
  }

  /* Footer */
  const fy = PH - 20;
  doc.setDrawColor(227, 230, 234);
  doc.line(M, fy - 4, PW - M, fy - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 148, 158);
  doc.text(
    "Generated automatically from the Harbour & Vine website.",
    M,
    fy + 2,
  );
  doc.text("Reply to this email to contact the applicant.", PW - M, fy + 2, {
    align: "right",
  });

  return doc;
}

/* ---------- Email Sending ---------- */
function emailJsConfigured() {
  return Boolean(
    CONFIG.EMAILJS_PUBLIC_KEY &&
    CONFIG.EMAILJS_SERVICE_ID &&
    CONFIG.EMAILJS_TEMPLATE_ID,
  );
}

function sendViaEmailJS(pdfBase64, pdfName, d, textSummary) {
  emailjs.init({ publicKey: CONFIG.EMAILJS_PUBLIC_KEY });
  const templateParams = {
    to_email: CONFIG.OWNER_EMAIL,
    subject: `New Rental Application — ${d.firstName} ${d.lastName}`,
    reply_to: d.tenantEmail,
    from_name: `${d.firstName} ${d.lastName}`,
    name: `${d.firstName} ${d.lastName}`,
    email: d.tenantEmail,
    phone: d.phone,
    property: d.propertyAddress,
    summary: textSummary,
  };
  return emailjs.send(
    CONFIG.EMAILJS_SERVICE_ID,
    CONFIG.EMAILJS_TEMPLATE_ID,
    templateParams,
    {
      attachments: [
        { name: pdfName, data: pdfBase64, type: "application/pdf" },
      ],
    },
  );
}

function sendViaMailto(d, textSummary) {
  const subject = encodeURIComponent(
    `New Rental Application — ${d.firstName} ${d.lastName}`,
  );
  const body = encodeURIComponent(textSummary);
  window.location.href = `mailto:${CONFIG.OWNER_EMAIL}?subject=${subject}&body=${body}`;
}

/* =========================================================
   Initialize Everything
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  // Set year in footer
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const form = document.getElementById("rentalForm");
  const btn = document.getElementById("submitBtn");
  const statusEl = document.getElementById("status");
  const canvas = document.getElementById("signatureCanvas");
  const clearBtn = document.getElementById("clearSignature");

  if (!form || !btn || !statusEl) return;

  /* --- Signature Pad Setup --- */
  let signaturePad = null;
  if (canvas && window.SignaturePad) {
    signaturePad = new SignaturePad(canvas, {
      backgroundColor: "rgba(255,255,255,0)",
      penColor: "#1c1917",
      minWidth: 0.8,
      maxWidth: 2.4,
      throttle: 0,
    });

    let lastWidth = 0;

    function sizeCanvas(force) {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (!w || !h) return;

      // Only resize when the WIDTH changes. Mobile browsers fire
      // resize events when the URL bar hides/shows on scroll — we
      // must not wipe the drawing on those.
      if (!force && w === lastWidth) return;
      lastWidth = w;

      // Preserve whatever strokes already exist.
      const existing = signaturePad.toData();

      canvas.width = w * ratio;
      canvas.height = h * ratio;
      canvas.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);

      signaturePad.clear();
      if (existing && existing.length) signaturePad.fromData(existing);
    }

    // Size once layout has settled.
    // Wait until canvas actually has dimensions, then size it.
    // (Slow networks can render the canvas at 0×0 before CSS applies.)
    function waitForLayout() {
      if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
        sizeCanvas(true);
      } else {
        setTimeout(waitForLayout, 50);
      }
    }
    waitForLayout();

    // Only react to true width changes (orientation, breakpoint).
    if (window.ResizeObserver) {
      new ResizeObserver(() => sizeCanvas(false)).observe(canvas.parentElement);
    } else {
      window.addEventListener("orientationchange", () => sizeCanvas(true));
    }

    // Clear button — preventDefault stops it submitting the form.
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      signaturePad.clear();
    });

    // Chrome 136+ on mobile sometimes scrolls instead of capturing touch.
    // Explicitly prevent default on touch events inside the canvas.
    canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
      },
      { passive: false },
    );

    canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
      },
      { passive: false },
    );

    canvas.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
      },
      { passive: false },
    );

    console.log('[signature] SignaturePad initialized', signaturePad);
  }

  /* --- Form Submission --- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate form
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Check if signature is empty
    if (signaturePad && signaturePad.isEmpty()) {
      statusEl.className = "status error";
      statusEl.textContent = "Please provide your signature before submitting.";
      return;
    }

    // Reset UI
    statusEl.className = "status";
    statusEl.textContent = "";
    btn.disabled = true;
    btn.classList.add("loading");
    const label = btn.querySelector(".btn-label");
    const originalLabel = label.textContent;
    label.textContent = "Sending…";

    try {
      const data = collectData(form);
      const signatureDataUrl = signaturePad
        ? signaturePad.toDataURL("image/png")
        : null;

      const doc = buildPdf(data, signatureDataUrl);
      const pdfBase64 = doc.output("datauristring").split("base64,")[1];
      const pdfName = `Application-${data.firstName}-${data.lastName}-${Date.now()}.pdf`;
      const textSummary = buildTextSummary(data);

      // Send
      if (emailJsConfigured()) {
        await sendViaEmailJS(pdfBase64, pdfName, data, textSummary);
      } else {
        sendViaMailto(data, textSummary);
      }

      // Success
      label.textContent = "Sent";
      statusEl.className = "status success";
      statusEl.textContent = `Thanks, ${data.firstName}. Your application has been sent. We will be in touch shortly.`;

      form.reset();
      if (signaturePad) signaturePad.clear();
    } catch (err) {
      console.error("[application]", err);
      label.textContent = originalLabel;
      statusEl.className = "status error";
      statusEl.textContent = `Sorry — something went wrong sending your application. Please email us directly at ${CONFIG.OWNER_EMAIL}.`;
    } finally {
      btn.disabled = false;
      btn.classList.remove("loading");
      setTimeout(() => {
        label.textContent = originalLabel;
      }, 2500);
    }
  });
});
