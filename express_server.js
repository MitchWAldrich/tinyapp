const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const urlDatabase = [
  { shortened: 'b2xVn2', original: 'http://www.lighthouselabs.ca' },
  { shortened: '9sm5xK', original: 'http://www.google.com' }
];

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  const shorteningLink = 'Follow this link to shorten your URL:'
  res.render('urls_index', {
    urlDatabase: urlDatabase,
    shorteningLink: shorteningLink
  });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});