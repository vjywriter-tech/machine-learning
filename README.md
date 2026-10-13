# GTU Machine Learning Examination Portal

Production-ready Next.js examination portal for GTU Subject 3171114, Units 1 to 3.

## Included

- Four private question sets, each containing 20 different objective questions.
- Random question and option order for every attempt.
- Student entry using enrollment number and name; no login required.
- 20-minute timer and automatic submission.
- One submitted attempt per enrollment number per set.
- Server-side grading; correct answers are never sent to the browser.
- Results saved as private JSON objects in Cloudflare R2.
- Faculty password login with an 8-hour secure session.
- Faculty table sorted by marks in ascending order.
- Filter by question set and export the visible results to Excel.
- Copy buttons for all four private set links.

## 1. Install and test locally

Install Node.js 22, open this folder in VS Code, and run:

```powershell
npm install
```

Create `.env.local` in the project root by copying `.env.example`.

Generate six secure random values:

```powershell
node -e "const c=require('crypto'); ['SESSION_SECRET','EXAM_SIGNING_SECRET','EXAM_SET_1_TOKEN','EXAM_SET_2_TOKEN','EXAM_SET_3_TOKEN','EXAM_SET_4_TOKEN'].forEach(k=>console.log(k+'='+c.randomBytes(32).toString('hex')))"
```

Copy the output into `.env.local`, then add the four R2 credentials and faculty password.

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=gtu-ml-exam-results
FACULTY_PASSWORD=choose-a-strong-password
SESSION_SECRET=generated-value
EXAM_SIGNING_SECRET=generated-value
EXAM_SET_1_TOKEN=generated-value
EXAM_SET_2_TOKEN=generated-value
EXAM_SET_3_TOKEN=generated-value
EXAM_SET_4_TOKEN=generated-value
```

Start locally:

```powershell
npm run dev
```

Open `http://localhost:3000/faculty`, log in, and use the four **Copy Link** buttons.

## 2. Create Cloudflare R2 storage

1. Open Cloudflare Dashboard.
2. Go to **Storage & databases -> R2 Object Storage**.
3. Create a private bucket named `gtu-ml-exam-results`.
4. Open **Manage R2 API Tokens**.
5. Create a token with **Object Read & Write** permission, restricted to this bucket.
6. Copy the **Access Key ID** and **Secret Access Key** immediately.
7. Copy the Account ID from the R2 S3 endpoint:
   `https://ACCOUNT_ID.r2.cloudflarestorage.com`.

No R2 CORS policy is required because the browser never connects directly to R2. All reads and writes pass through protected Next.js server routes.

R2 result objects are stored under:

```text
ml-exam/results/set-1/ENROLLMENT.json
ml-exam/results/set-2/ENROLLMENT.json
ml-exam/results/set-3/ENROLLMENT.json
ml-exam/results/set-4/ENROLLMENT.json
```

## 3. Upload to GitHub

```powershell
git init
git add .
git commit -m "Create GTU machine learning exam portal"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

`.env.local` is excluded by `.gitignore` and must never be uploaded.

## 4. Deploy on Vercel

1. Import the GitHub repository into Vercel.
2. Vercel should detect **Next.js** automatically.
3. Add all 11 variables from `.env.local` under **Project -> Settings -> Environment Variables**.
4. Enable them for Production and Preview.
5. Deploy or redeploy the project.
6. Open `https://YOUR-DOMAIN.vercel.app/faculty`.
7. Log in and copy the four production links. The dashboard builds the links using the current production domain.

## Security behaviour

- Set links contain long random tokens rather than `set-1`, `set-2`, etc.
- Editing or guessing the URL produces an invalid-link error.
- A student who is deliberately given another valid link can still open it because student login is intentionally not required.
- Results and answer keys remain private and server-side.
- Changing an R2 result manually is not supported; use the faculty dashboard for normal access.

## Changing questions

Questions and correct answers are stored server-side in `lib/questions.ts`. Each `answer` is a zero-based option index before per-attempt randomization.
