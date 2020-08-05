import * as fs from 'fs';
import * as path from 'path';
import { chromium, Page } from 'playwright';

const notifications: string[] = [];

function createEmailFile(): void {
  const emailPath = path.resolve(__dirname, '../email.txt');

  const singular = notifications.length === 1;
  const body = `
There ${singular ? 'is' : 'are'} ${notifications.length} notification${singular ? '' : 's'} from tue-notebook-notifier:
${notifications.map(notification => `- ${notification}`).join('\n')}
  `.trim();

  fs.writeFileSync(emailPath, body + '\n');

  console.log(`Created ${emailPath} with the following content:`);
  console.log(body);
}

async function getCharCount(page: Page, url: string): Promise<number> {
  await page.goto(url);

  const text = await page.evaluate(() => {
    return document.querySelector('.mainContentColumn').textContent;
  });

  return text.trim().length;
}

async function check(page: Page, url: string, language: string, knownCharCount: number): Promise<void> {
  const charCount = await getCharCount(page, url);

  if (charCount !== knownCharCount) {
    notifications.push(`The ${language} page has been updated: ${url}`);
  }
}

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await check(page, 'https://studiegids.tue.nl/studeren/voorzieningen/notebook-kortingsregeling/', 'Dutch', 786);
    await check(page, 'https://educationguide.tue.nl/studying/services/notebook-reduction-program/', 'English', 636);

    await browser.close();

    if (notifications.length > 0) {
      createEmailFile();
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
