# Putting Westboory online

About 30 minutes, no coding. You'll set up two free things:

1. **A Google Sheet** that stores sign-ups. It's also your dashboard.
2. **Replit**, which hosts the website.

A custom address like westboory.com is optional and can come later.

---

## Step 1: Create the Google Sheet (stores sign-ups)

1. Go to **sheets.new** and name the sheet **Westboory sign-ups**.
2. In the menu, choose **Extensions → Apps Script**.
3. Delete the code that's already there. Open `backend/Code.gs` from this project, copy all of it, and paste it in.
4. Click the **💾 Save** icon.
5. At the top, find the dropdown next to **▶ Run** and pick **setup**. Then click **▶ Run**.
   - Google will ask for permission. Click **Review permissions** and pick your account.
   - You'll see "Google hasn't verified this app". That's expected, because you wrote the app. Click **Advanced → Go to Westboory (unsafe) → Allow**.
   - Back in your sheet, you'll now see three new tabs: **Treat Houses**, **Candy Requests**, and **Not This Year**.

## Step 2: Turn the sheet into a web address

1. Still in Apps Script, click **Deploy → New deployment**.
2. Click the gear ⚙ next to "Select type" and choose **Web app**.
3. Use these settings:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** and copy the **Web app URL**. It starts with `https://script.google.com/macros/s/…` and ends in `/exec`.

## Step 3: Add your details to the website

Open `js/config.js`, either on GitHub (open the file, then click the ✏️ pencil icon) or in Replit after Step 4. Change these lines:

| Setting | What to put |
|---|---|
| `apiUrl` | The Web app URL from Step 2, inside the quotes |
| `eventTime` | Your trick-or-treat hours |
| `organizerEmail` | An email address neighbors can write to |
| `candyRequestDeadline` | The last day people can ask for a candy drop-off |
| `streets` | **Check this list.** It's what people see as they type their street. Fix any spelling and add missing streets, especially in Section 3. |

Click **Commit changes**.

## Step 4: Bring the project into Replit

1. Sign in at **replit.com**. The free Starter plan includes one static site, which is all Westboory needs.
2. Click **+ Create App** (or **Import**), choose **Import from GitHub**, and connect your GitHub account if asked.
3. Pick **alainadalehue/Westboory** and click **Import**.
4. Click the green **▶ Run** button. A preview of the site opens inside Replit, with the yellow "Preview mode" bar until you finish Step 3.

If you edit `js/config.js` inside Replit instead of on GitHub, that's fine too. Just do your edits in one place so the two copies don't get out of step.

## Step 5: Publish it

1. In Replit, click **Publish** (or **Deploy**) at the top right.
2. Choose **Static**. If it asks for a public directory, use **/** (the project's top folder). The project's `.replit` file already sets this.
3. Click **Publish**. Your site goes live at an address like `westboory.replit.app`. Open it on your phone and try it.
4. **Each time you change something, click Publish again.** Changes don't go live until you do.

**Want westboory.com?** You can buy the domain through Replit (in the Publish settings, look for **Domains → Buy a domain**), and Replit connects it automatically. If you buy it somewhere else, choose **Link a domain** and add the DNS records Replit shows you. The `.replit.app` address works fine for the test run, so a custom domain is optional.

## Step 6: Test it before sharing

1. On the live site, tap **Yes! Count me in** and enter your own address.
2. Within about a minute, your pumpkin should appear on the map and in the street list. You'll also see a new row in the **Treat Houses** tab.
3. Try **We'll bring the candy to you** with a test name. You should get an email, and a row should appear in **Candy Requests**.
4. Delete your test rows from the sheet.

---

## Running it day to day

**Removing a house from the map.** Untick **Show on map** in the Treat Houses tab, or delete the row. The site updates within about a minute.

**Addresses flagged in the "Note" column:**
- *Address not found:* Google couldn't place it, so it shows in the street list but not on the map. Fix the street name and add the Latitude and Longitude yourself. In Google Maps, right-click the house and click the numbers to copy them.
- *Outside Westbury:* hidden until you tick **Show on map**. This keeps pranks off the map.

**Candy drop-offs.** Each request lands in **Candy Requests**, and you get an email. Type a helper's name in the **Volunteer** column and tick **Delivered** when the candy has been dropped off. This tab is never shown on the website. Share the sheet only with people you trust, because it has names and phone numbers.

**The "no" tally.** The **Not This Year** tab only records when someone answered. It doesn't save who they are.

**Changing `backend/Code.gs` later.** After pasting in the new code, go to **Deploy → Manage deployments → ✏️ Edit**, set **Version: New version**, and click **Deploy**. The web address stays the same.

**Stopping emails.** In Apps Script, set `EMAIL_ME_ON_CANDY_REQUEST = false`, then redeploy as described above.
