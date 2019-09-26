const { App } = require('@slack/bolt');

const rules = [
    {
        name: 'capital-first',
        level: 'error',
        message: 'first letter of message must be a capital letter.',
        test: /^[^A-Z]/,
    },
    {
        name: 'use-punctuation',
        level: 'error',
        message: 'Message must end with appropriate punctuation (.?!)',
        test: /[^\.\?\!]$/,
    },
];

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const execAll = (re, str) => {
  let match;
  let arr = [];

  if (!re.global) return re.test(str) ? [re.exec(str)] : null;

  while (match = re.exec(str)) {
    if (match) arr.push(match);
  }
  return arr;
}

app.message(({ message: { user, text }, say }) => {
  const lineBreaks = execAll(/\n/g, text).map(m => m.index);
  const errors = rules.reduce((acc, rule) => {
    const matches = execAll(rule.test, text);

    if (!matches) return acc;

    return acc.concat(matches.map(match => {
        const row = lineBreaks.filter(i => i < match.index).length + 1;
        const col = match.index - (lineBreaks[row-2] || 0);
        const { level, message, name } = rule;

        return `${row}:${col}\t${level}\t${message}\t${name}`;
    }));
  }, []);

  if (errors.length) say(`\`\`\`${errors.join('\n')}\`\`\``);
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();
