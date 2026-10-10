# Putting Westboory online

About 30 minutes, no coding. You'll set up three free things:

1. **A Google Sheet** that stores sign-ups. It's also your dashboard.
2. **GitHub Pages**, which hosts the website.
3. **westboory.com**, pointed at GitHub Pages.

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

Open `js/config.js` on GitHub (open the file, then click the ✏️ pencil icon). Change these lines:

| Setting | What to put |
|---|---|
| `apiUrl` | The Web app URL from Step 2, inside the quotes |
| `eventTime` | Your trick-or-treat hours |
| `organizerEmail` | An email address neighbors can write to |
| `candyRequestDeadline` | The last day people can ask for a candy drop-off |
| `streets` | **Check this list.** It's what people see as they type their street. Fix any spelling and add missing streets, especially in Section 3. |

Click **Commit changes**.

## Step 4: Make the repository public

GitHub Pages hosts private repositories only on paid plans. On a free account, the repository has to be public.

1. On GitHub, open the **Westboory** repository and click **⚙ Settings** (on the top bar, at the far right).
2. Scroll all the way down to the red **Danger Zone** and click **Change visibility → Change to public**.
3. Confirm the warnings and type the repository name when asked.

Going public shows only the website's code. Neighbors' sign-ups live in your Google Sheet and are never in the repository.

## Step 5: Turn on GitHub Pages and connect westboory.com

1. In the repository, go to **⚙ Settings → Pages** (in the left sidebar).
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**. Set **Branch** to **main**, keep the folder as **/ (root)**, and click **Save**.
3. After a minute or two, the site is live at `https://alainadalehue.github.io/Westboory/`. Open it on your phone and try it.
4. Under **Custom domain**, type `westboory.com` and click **Save**.
5. Where you bought the domain (GoDaddy, Namecheap, Squarespace, Google…), open its **DNS settings** and add these records:

   | Type | Name / Host | Value |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | alainadalehue.github.io |

   Delete any other **A** records for **@** (many companies add a "parking" record by default).
6. Back in **Settings → Pages**, wait for the DNS check to pass, then tick **Enforce HTTPS**. DNS changes can take anywhere from a few minutes to a few hours.

If you haven't bought westboory.com yet, buy it from any domain company first, then do steps 4–6.

From now on, every change you commit on GitHub updates the site automatically within a minute or two.

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
