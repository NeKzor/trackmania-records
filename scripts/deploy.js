const ghPages = require('gh-pages');
const { log } = require('./utils');

const output = process.argv[3] || __dirname + '/../build';

ghPages.publish(
    output,
    {
        repo: `https://${process.env.GITHUB_TOKEN}@github.com/NeKzor/tmx-records.git`,
        silent: true,
        branch: 'gh-pages',
        message: 'Update',
        user: {
            name: 'NeKzor',
            email: 'NeKzor@users.noreply.github.com',
        },
    },
    (err) => (err ? log.error(err) : log.success('Deployed')),
);
