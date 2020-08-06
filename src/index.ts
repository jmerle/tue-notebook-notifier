import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import got from 'got';

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

async function getCharCount(url: string): Promise<number> {
  const { body } = await got(url);
  const $ = cheerio.load(body);
  return $('.mainContentColumn').text().trim().length;
}

async function check(url: string, language: string, knownCharCount: number): Promise<void> {
  const charCount = await getCharCount(url);

  if (charCount !== knownCharCount) {
    notifications.push(`The ${language} page has been updated: ${url}`);
  }
}

(async () => {
  try {
    await check('https://studiegids.tue.nl/studeren/voorzieningen/notebook-kortingsregeling/', 'Dutch', 787);
    await check('https://educationguide.tue.nl/studying/services/notebook-reduction-program/', 'English', 636);

    if (notifications.length > 0) {
      createEmailFile();
      console.log('::set-env name=SEND_EMAIL::true');
    } else {
      console.log('::set-env name=SEND_EMAIL::false');
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
