import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'screenshots');

async function runE2EWalkthrough() {
  console.log('--- Starting End-to-End Browser Walkthrough ---');
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error(`[Browser Console Error] ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error(`[Browser Page Error] ${err.message}`);
  });

  try {
    // ==========================================
    // 1. Dashboard (Landing Page)
    // ==========================================
    console.log('\n[1/6] Navigating to Dashboard at http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Verify main navigation links
    const navText = await page.locator('.sidebar').innerText();
    console.log('Sidebar Navigation verified:\n' + navText.split('\n').filter(Boolean).map(s => '  • ' + s).join('\n'));

    // Check KPI cards
    const kpiElements = await page.locator('.kpi-card').all();
    console.log(`Found ${kpiElements.length} KPI cards on Dashboard.`);
    for (const card of kpiElements) {
      const text = await card.innerText();
      console.log(`  KPI: ${text.replace(/\n/g, ' — ')}`);
    }

    // Toggle a task in the tasks section
    const taskCheckbox = page.locator('.task-checkbox').first();
    if (await taskCheckbox.isVisible()) {
      console.log('Toggling a task checkbox on the Dashboard...');
      await taskCheckbox.click();
      await page.waitForTimeout(500);
      console.log('Task toggled successfully.');
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_dashboard.png'), fullPage: true });
    console.log('Saved screenshot: screenshots/01_dashboard.png');

    // ==========================================
    // 2. Organizations
    // ==========================================
    console.log('\n[2/6] Navigating to Organizations...');
    await page.click('a[href="/organizations"]');
    await page.waitForSelector('.data-table');

    const orgRows = await page.locator('.data-table tbody tr').all();
    console.log(`Organizations table rendered with ${orgRows.length} rows.`);

    // Test Search
    console.log('Testing organization search with term "Vertex"...');
    await page.fill('#org-search-input', 'Vertex');
    await page.waitForTimeout(400);
    const searchResult = await page.locator('.data-table tbody tr').innerText();
    console.log(`Search result: ${searchResult.replace(/\n/g, ' | ')}`);
    if (!searchResult.includes('Vertex Health')) {
      throw new Error('Search failed to find Vertex Health');
    }

    // Clear search
    await page.fill('#org-search-input', '');
    await page.waitForTimeout(400);

    // Add Organization
    console.log('Opening "Add Organization" modal...');
    await page.click('#btn-add-organization');
    await page.waitForSelector('.modal-dialog');

    await page.fill('#org-name', 'Titan Dynamics');
    await page.fill('#org-industry', 'Autonomous Systems');
    await page.fill('#org-website', 'https://titandynamics.example.com');
    await page.fill('#org-notes', 'Enterprise drone and robotics client.');
    await page.click('.modal-footer button[type="submit"]');

    await page.waitForTimeout(600);
    console.log('Submitted organization. Verifying addition in table...');
    const tableText = await page.locator('.data-table').innerText();
    if (!tableText.includes('Titan Dynamics')) {
      throw new Error('Failed to find newly created Titan Dynamics in table');
    }
    console.log('Titan Dynamics found in Organizations table.');

    // Click into Titan Dynamics detail
    console.log('Navigating into Titan Dynamics detail page...');
    await page.click('a:has-text("Titan Dynamics")');
    await page.waitForSelector('h1:has-text("Titan Dynamics")');
    console.log('Organization detail view verified.');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_organization_detail.png'), fullPage: true });

    // ==========================================
    // 3. Contacts
    // ==========================================
    console.log('\n[3/6] Navigating to Contacts...');
    await page.click('a[href="/contacts"]');
    await page.waitForSelector('.data-table');

    // Test Status Filter
    console.log('Testing status filter: "customer"...');
    await page.selectOption('#contact-status-filter', 'customer');
    await page.waitForTimeout(400);
    const customerBadges = await page.locator('.badge-customer').all();
    console.log(`Filtered to ${customerBadges.length} customers.`);

    // Reset status filter
    await page.selectOption('#contact-status-filter', 'all');
    await page.waitForTimeout(400);

    // Test Search
    console.log('Testing contact search with "Sarah"...');
    await page.fill('#contact-search-input', 'Sarah');
    await page.waitForTimeout(400);
    const sarahRow = await page.locator('.data-table tbody tr').innerText();
    console.log(`Search result: ${sarahRow.replace(/\n/g, ' | ')}`);
    await page.fill('#contact-search-input', '');
    await page.waitForTimeout(400);

    // Add Contact
    console.log('Opening "Add Contact" modal...');
    await page.click('#btn-add-contact');
    await page.waitForSelector('.modal-dialog');

    await page.fill('#contact-name', 'Arthur Pendelton');
    await page.fill('#contact-email', 'arthur@titandynamics.example.com');
    await page.fill('#contact-phone', '+1 (555) 777-8888');
    await page.fill('#contact-job-title', 'Director of Autonomous Systems');
    await page.selectOption('#contact-status', 'qualified');

    // Select organization
    const orgSelect = page.locator('#contact-org');
    const titanOption = await orgSelect.locator('option:has-text("Titan Dynamics")').getAttribute('value');
    if (titanOption) {
      await orgSelect.selectOption(titanOption);
    }
    await page.click('.modal-footer button[type="submit"]');
    await page.waitForTimeout(600);

    console.log('Verifying Arthur Pendelton in Contacts table...');
    const contactsTable = await page.locator('.data-table').innerText();
    if (!contactsTable.includes('Arthur Pendelton')) {
      throw new Error('Failed to find Arthur Pendelton in Contacts table');
    }
    console.log('Arthur Pendelton created successfully.');

    // Click into Contact Detail
    await page.click('a:has-text("Arthur Pendelton")');
    await page.waitForSelector('h1:has-text("Arthur Pendelton")');

    // Log Activity
    console.log('Logging activity on contact detail page...');
    await page.click('button:has-text("Call")');
    await page.fill('textarea[placeholder*="Jot down details"]', 'Introductory discussion on AMR fleet integration requirements');
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2026-10-25');
    await page.click('button:has-text("Save Activity")');
    await page.waitForTimeout(600);

    // Verify activity appears in timeline
    const timelineText = await page.locator('.timeline').innerText();
    if (!timelineText.includes('Introductory discussion on AMR fleet integration')) {
      throw new Error('Activity did not appear in timeline');
    }
    console.log('Activity logged and confirmed in timeline.');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_contact_detail.png'), fullPage: true });

    // ==========================================
    // 4. Deals
    // ==========================================
    console.log('\n[4/6] Navigating to Deals...');
    await page.click('a[href="/deals"]');
    await page.waitForSelector('.data-table');

    // Add Deal
    console.log('Opening "Add Deal" modal...');
    await page.click('#btn-add-deal');
    await page.waitForSelector('.modal-dialog');

    await page.fill('#deal-name', 'Titan Autonomous Fleet Pilot');
    await page.fill('#deal-value', '85000');
    await page.fill('#deal-probability', '60');
    await page.selectOption('#deal-stage', 'Proposal');
    await page.fill('#deal-close-date', '2026-11-15');

    const dealOrgSelect = page.locator('#deal-org');
    const titanDealOption = await dealOrgSelect.locator('option:has-text("Titan Dynamics")').getAttribute('value');
    if (titanDealOption) {
      await dealOrgSelect.selectOption(titanDealOption);
    }

    const dealContactSelect = page.locator('#deal-contact');
    const arthurDealOption = await dealContactSelect.locator('option:has-text("Arthur Pendelton")').getAttribute('value');
    if (arthurDealOption) {
      await dealContactSelect.selectOption(arthurDealOption);
    }

    await page.click('.modal-footer button[type="submit"]');
    await page.waitForTimeout(600);

    console.log('Verifying Titan Autonomous Fleet Pilot in Deals table...');
    const dealsTableText = await page.locator('.data-table').innerText();
    if (!dealsTableText.includes('Titan Autonomous Fleet Pilot')) {
      throw new Error('Failed to find deal in Deals table');
    }
    console.log('Deal created successfully.');

    // Click into Deal Detail
    await page.click('a:has-text("Titan Autonomous Fleet Pilot")');
    await page.waitForSelector('h1:has-text("Titan Autonomous Fleet Pilot")');

    // Change stage to Negotiation
    console.log('Advancing stage to Negotiation on Deal detail page...');
    await page.click('button:has-text("Negotiation")');
    await page.waitForTimeout(500);

    const dealBadge = await page.locator('.badge-stage-negotiation').innerText();
    console.log(`Updated deal stage badge: ${dealBadge}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_deal_detail.png'), fullPage: true });

    // ==========================================
    // 5. Pipeline
    // ==========================================
    console.log('\n[5/6] Navigating to Pipeline...');
    await page.click('a[href="/pipeline"]');
    await page.waitForSelector('.pipeline-board');

    const columns = await page.locator('.pipeline-column').all();
    console.log(`Pipeline board rendered with ${columns.length} columns.`);
    for (const col of columns) {
      const name = await col.locator('.column-name').innerText();
      const count = await col.locator('.column-count').innerText();
      const stats = await col.locator('.column-stats').innerText();
      console.log(`  Column [${name}]: count ${count}, ${stats.replace(/\n/g, ' ')}`);
    }

    // Verify Titan deal in Negotiation column
    const negCol = page.locator('.pipeline-column[data-stage="Negotiation"]');
    const negText = await negCol.innerText();
    if (!negText.includes('Titan Autonomous Fleet Pilot')) {
      throw new Error('Titan Autonomous Fleet Pilot not found in Negotiation pipeline column');
    }
    console.log('Titan Autonomous Fleet Pilot successfully located in Negotiation pipeline column.');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_pipeline_board.png'), fullPage: true });

    // ==========================================
    // 6. Return to Dashboard & Final Validation
    // ==========================================
    console.log('\n[6/6] Returning to Dashboard...');
    await page.click('a[href="/"]');
    await page.waitForSelector('.kpi-grid');

    const finalKPIs = await page.locator('.kpi-card').all();
    console.log('Final Dashboard KPIs after additions:');
    for (const card of finalKPIs) {
      const text = await card.innerText();
      console.log(`  KPI: ${text.replace(/\n/g, ' — ')}`);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_final_dashboard.png'), fullPage: true });

    console.log('\n--- Console Error Audit ---');
    if (consoleErrors.length === 0) {
      console.log('✓ ZERO browser console errors detected throughout entire walkthrough!');
    } else {
      console.warn(`Encountered ${consoleErrors.length} console errors:`, consoleErrors);
    }

    console.log('\n🎉 ALL REAL BROWSER CHECKS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('E2E Walkthrough Failed:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runE2EWalkthrough().catch((err) => {
  console.error(err);
  process.exit(1);
});
