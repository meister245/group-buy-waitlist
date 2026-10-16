# Kosárbarát – waitlist landing page

Static landing page for the pre-launch group ordering app (people in the same area combine Temu orders so shared item types pay import charges only once). Built from the product brief "Product Brief: Group Ordering App".

Pure HTML and CSS, with one small script for the waitlist form. No build step. Hosted on AWS: S3 and CloudFront for the site, API Gateway, Lambda, DynamoDB and SES for the waitlist, all set up with Terraform in `backend/terraform/`.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | Hungarian page (primary) |
| `en/index.html` | English version |
| `adatvedelem/`, `impresszum/` | Hungarian privacy notice and imprint |
| `en/privacy/`, `en/imprint/` | English privacy notice and imprint |
| `assets/styles.css` | All styles, animations and the CSS-only savings toggle |
| `assets/main.js` | Waitlist form submit, share links |
| `backend/` | Waitlist API code (`src/`) and Terraform for all AWS infrastructure (`terraform/`). Not uploaded with the site. |
| `.github/workflows/deploy.yml` | Uploads the site to S3 and refreshes CloudFront on every push to `main` |
| `assets/favicon.svg` | Logo mark |

Page sections, top to bottom: hero, the problem, how it works, savings example (organizer split chart, then the joiner preview and minimum-order graphic), organizers / joiners, trust, FAQ, waitlist form, footer with the independence disclaimer.

Messaging rules (from user feedback): talk about people in your local area ("környékeden élők"), not neighbours ("szomszédok"); never call the product an "app" (describe what happens, or use "we"); the English page uses typical British names in the examples; the launch is nationwide, so no Budapest or district prioritisation; no app fees or pricing, no technical details (hosting, sign-in provider), no trust-based limits. Show 2,300 HUF only as an extra cost per item type, never on its own where it could read as a saving.

## Run locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

Opened straight from disk, the waitlist form sends nothing: it logs the data to the console and shows the success panel. Served over HTTP, it posts to `/api/signup`, which only exists behind CloudFront, so locally you'll see the error message.

## Placeholders and open items

- **Product name.** "Kosárbarát" (kosár = cart, barát = friend; domain kosarbarat.hu). The page copy is built around people in your local area becoming "cart friends" / "kosárbarátok". Register the domain if not done yet.
- **Privacy notice and imprint.** The project is currently private and non-commercial; any move to a profit-oriented setup is a future decision. The pages are written for a private individual as the operator (no company, so no registration or tax number). The contact email is info@kosarbarat.hu; your full name is a placeholder (no postal address is published, by choice; the imprint states the non-commercial status). If the project becomes commercial, set up a sole proprietorship or company and add its address, registration and tax number, highlighted in yellow on the page (`<span class="fill">`). Fill them in on all four pages before collecting emails. The pages describe the setup as built (everything on AWS, data in Frankfurt, no cookies, no visit logs); update them if that changes, and have them checked by a lawyer if possible.
- **Fonts.** Self-hosted in `assets/fonts/` (Bricolage Grotesque and Figtree, variable WOFF2, Latin and Latin Extended subsets for Hungarian), declared at the top of `assets/styles.css`. Both are under the SIL Open Font License; the licence files sit next to the fonts. No requests go to Google.
- **Figures.** Numbers come from the brief's approved claims table, except the illustrative joiner example (Dóra's / Daisy's organizers and the 1,490 HUF phone case), which uses the same 2,305 HUF per item type and 50/50–70/30 splits. Recheck 2,300 HUF per item type against a real checkout after 1 November 2026.

## Hosting and waitlist backend

Everything runs on AWS and is described in `backend/terraform/`, one file per part:

```
visitor → CloudFront (kosarbarat.hu) ─┬─ /*      → S3 bucket (the static site)
                                       └─ /api/* → API Gateway → Lambda → DynamoDB (sign-ups)
                                                                         → SES (confirmation email)
```

The site bucket, API and data are in Frankfurt (eu-central-1); only the HTTPS certificate lives in us-east-1, as CloudFront requires. Site and API share one domain, so the form posts to `/api/signup` and the links in emails start with `https://kosarbarat.hu/api/`. A small CloudFront function (`functions/site-request.js`) redirects `www.` to the bare domain, adds the missing slash to `/en`, and serves `index.html` for folder addresses.

The waitlist API:

1. `POST /api/signup` checks the form, ignores bots that fill the hidden `website` field, saves the sign-up as *pending* and emails a confirmation link (Hungarian or English, from `backend/src/emails.mjs`). It sends at most one email per address every 10 minutes and gives the same answer whether or not the address is already signed up.
2. `GET /api/confirm?token=…` marks the sign-up *confirmed* and redirects to the page with `?confirmed=1`, where `main.js` shows a "You're on the waitlist" message. Expired or unknown links show "please sign up again".
3. `GET /api/unsubscribe?token=…` deletes the sign-up and redirects with `?unsubscribed=1`. Use this link in the launch email.

Sign-ups are deleted automatically through DynamoDB TTL: unconfirmed ones after 7 days, confirmed ones 12 months after confirmation. This enforces the "deleted 12 months after you sign up" promise in the form and the privacy notice. The API is limited to 5 requests per second.

### First deploy

You need Terraform 1.5 or later and AWS credentials for the target account. Settings are in `variables.tf` (domain, sender address, GitHub repository); override them in a `terraform.tfvars` file if needed.

**DNS.** Terraform creates a Route 53 zone for the domain and all records in it (certificate validation, the site's A/AAAA records, and the email DKIM and DMARC records). The domain stays registered where it is; only its name servers point to Route 53. The certificate can only be issued once that delegation works, so the first deploy has two steps:

1. Create the zone and print its name servers:

   ```sh
   cd backend/terraform
   terraform init
   terraform apply -target=aws_route53_zone.main
   terraform output name_servers
   ```

2. At the registrar, replace the domain's name servers with these four. `.hu` delegations are checked by the registry and usually take effect within a few hours; `dig NS kosarbarat.hu` shows the Route 53 servers once it's done.
3. Create everything else:

   ```sh
   terraform apply
   ```

   This takes about 15–30 minutes, mostly waiting for the certificate and CloudFront.

**Before switching the name servers:** after the switch, only the records in the Route 53 zone exist. Mail for `info@kosarbarat.hu` is received by an external mailbox provider, so put that provider's records into `terraform.tfvars` first (the values below are examples; use the ones your provider gives you):

```hcl
mail_records = [
  { name = "", type = "MX", records = ["10 mx1.example-provider.com", "20 mx2.example-provider.com"] },
  { name = "", type = "TXT", records = ["v=spf1 include:spf.example-provider.com ~all"] },
  { name = "provider1._domainkey", type = "CNAME", records = ["provider1.dkim.example-provider.com"] },
]
```

All values for the same name and type go into one entry (for example several TXT values on the bare domain). Don't add a `_dmarc` record here; Terraform already creates it in `email.tf`. The SPF record only needs the mailbox provider: SES sends with its own bounce domain and signs with DKIM, which is what DMARC checks.

If the AWS account already has a GitHub OIDC provider, set `create_github_oidc_provider = false` in `terraform.tfvars`.

**Then:**

1. **Connect the deploy workflow.** In GitHub → Settings → Secrets and variables → Actions → Variables, add the three values from the `github_variables` output (`AWS_DEPLOY_ROLE_ARN`, `SITE_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`). Every push to `main` then uploads the site and refreshes CloudFront; you can also run the workflow by hand. No AWS keys are stored in GitHub: the workflow gets short-lived credentials through OIDC, and only the `main` branch may use the role.
2. **Leave the SES sandbox.** New SES accounts can only send to addresses you have verified yourself. For testing, verify your own email in the SES console. Before launch, request production access in SES → Account dashboard (AWS replies within about a day).
3. **Test** by signing up with your own email on both pages, then click the link in each email.

To see who is on the list, look at the `kosarbarat-waitlist` table in the DynamoDB console (`status = confirmed`), or export it with `aws dynamodb scan`.

## Notes

- No shop logos, colours, fonts or screenshots are used. Illustrations are inline SVG.
- Animations respect `prefers-reduced-motion`. Scroll reveals use CSS scroll-driven animations where supported; other browsers show the content without them.
