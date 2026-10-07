// npm run data:validate — fail the build if the data breaks any provenance or sanity rule.
import { openDb } from '../src/data/sqlite/connection.ts';
import { loadValidationData } from '../src/data/sqlite/validation-data.ts';
import { validate } from '../src/research/validation.ts';

const db = openDb();
const issues = validate(loadValidationData(db));
db.close();
const errors = issues.filter((i) => i.level === 'error');
const warnings = issues.filter((i) => i.level === 'warning');
for (const w of warnings) console.warn(`warning [${w.check}] ${w.message}`);
for (const e of errors) console.error(`error   [${e.check}] ${e.message}`);
if (errors.length) {
  console.error(`\nData validation failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`Data validation passed (${warnings.length} warning(s)).`);
