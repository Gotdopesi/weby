/** Sdílené HTML pro transakční e-maily (bez importů — bezpečné na Vercelu). */

export type SalonEmailButton = {
  href: string;
  label: string;
  /** tmavé (výchozí) | gold */
  variant?: "dark" | "gold";
};

export function salonEmailButton({ href, label, variant = "dark" }: SalonEmailButton): string {
  const bg = variant === "gold" ? "#b8860b" : "#1a1a1a";
  const border = variant === "gold" ? "#b8860b" : "#1a1a1a";
  const safeHref = href.replace(/"/g, "&quot;");
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:28px auto 8px;">
  <tr>
    <td align="center" bgcolor="${bg}" style="border-radius:10px;mso-padding-alt:16px 32px;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${safeHref}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="12%" strokecolor="${border}" fillcolor="${bg}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${safeLabel}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${safeHref}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block;padding:16px 36px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:bold;color:#ffffff !important;text-decoration:none !important;border-radius:10px;background-color:${bg};border:1px solid ${border};mso-hide:all;">
        <span style="color:#ffffff !important;text-decoration:none !important;">${safeLabel}</span>
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
}

export function salonEmailLayout(opts: {
  preheader: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
  footerHtml?: string;
}): string {
  const preheader = escapeHtml(opts.preheader);
  const eyebrow = escapeHtml(opts.eyebrow);
  const title = escapeHtml(opts.title);
  const footer =
    opts.footerHtml ??
    `<p style="margin:0;font-size:12px;line-height:1.6;color:#9a948c;text-align:center;">
      Tento e-mail byl odeslán automaticky, neodpovídejte na něj.
    </p>`;

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ebe3;font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f0ebe3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,26,26,0.08);">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#d4af37,#b8860b);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:36px 32px 12px;text-align:center;">
              <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#b8860b;">${eyebrow}</p>
              <h1 style="margin:0;font-size:28px;font-weight:normal;line-height:1.3;color:#1a1a1a;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 36px;font-size:16px;line-height:1.65;color:#3d3a36;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">${footer}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function salonEmailDetailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #efe9df;color:#8a847c;font-size:14px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #efe9df;color:#1a1a1a;font-size:15px;font-weight:bold;vertical-align:top;">${escapeHtml(value)}</td>
  </tr>`;
}

export function salonEmailDetailsTable(rows: string): string {
  return `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;border-collapse:collapse;">${rows}</table>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildBookingConfirmationEmail(p: {
  customerName: string;
  service: string;
  bookingDate: string;
  bookingTime: string;
  barbershopName: string;
  barbershopEmail?: string | null;
  phone: string;
  cancelUrl: string | null;
}): string {
  const contact = p.barbershopEmail
    ? `<a href="mailto:${escapeHtml(p.barbershopEmail)}" style="color:#b8860b;text-decoration:none;">${escapeHtml(p.barbershopEmail)}</a>`
    : "viz web salónu";

  const rows = [
    salonEmailDetailRow("Služba", p.service),
    salonEmailDetailRow("Datum", p.bookingDate),
    salonEmailDetailRow("Čas", p.bookingTime),
    salonEmailDetailRow("Telefon", p.phone),
  ].join("");

  const cancelBlock = p.cancelUrl
    ? `<p style="margin:24px 0 0;text-align:center;color:#5c574f;font-size:14px;">
         Rezervaci můžete zrušit online nejpozději <strong>24&nbsp;hodin</strong> před termínem.
       </p>
       ${salonEmailButton({ href: p.cancelUrl, label: "Zrušit rezervaci", variant: "dark" })}
       <p style="margin:8px 0 0;text-align:center;font-size:12px;color:#9a948c;">
         Tlačítko nefunguje? Otevřete odkaz pro zrušení přímo na webu salónu.
       </p>`
    : "";

  return salonEmailLayout({
    preheader: `Potvrzení rezervace — ${p.service}, ${p.bookingDate} ${p.bookingTime}`,
    eyebrow: "Potvrzení rezervace",
    title: p.barbershopName,
    bodyHtml: `<p style="margin:0 0 16px;">Dobrý den, <strong>${escapeHtml(p.customerName)}</strong>,</p>
      <p style="margin:0 0 8px;">děkujeme za rezervaci. Těšíme se na vás.</p>
      ${salonEmailDetailsTable(rows)}
      <p style="margin:20px 0 0;font-size:14px;color:#5c574f;">Kontakt salónu: ${contact}</p>
      ${cancelBlock}`,
  });
}

export function buildPasswordResetEmail(p: {
  shopName: string;
  actionLink: string;
}): string {
  return salonEmailLayout({
    preheader: `Obnovení hesla — ${p.shopName}`,
    eyebrow: "Admin přístup",
    title: "Obnovení hesla",
    bodyHtml: `<p style="margin:0 0 16px;">Dobrý den,</p>
      <p style="margin:0 0 8px;">obdrželi jsme žádost o změnu hesla k admin účtu salónu <strong>${escapeHtml(p.shopName)}</strong>.</p>
      <p style="margin:0 0 8px;">Klikněte na tlačítko níže a zvolte si nové heslo. Odkaz je platný omezenou dobu.</p>
      ${salonEmailButton({ href: p.actionLink, label: "Nastavit nové heslo", variant: "gold" })}
      <p style="margin:16px 0 0;font-size:13px;color:#9a948c;text-align:center;">
        Pokud jste o změnu nežádali, tento e-mail ignorujte.
      </p>`,
  });
}
