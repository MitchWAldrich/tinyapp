const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const urlDatabase = [
  { shortURL: 'b2xVn2', longURL: 'http://www.lighthouselabs.ca' },
  { shortURL: '9sm5xK', longURL: 'http://www.google.com' }
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
  const shorteningLink = 'Follow this link to shorten your URL:'
  res.render('urls_index', {
    urlDatabase: urlDatabase,
    shorteningLink: shorteningLink
  });
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: urlDatabase.shortURL, longURL: urlDatabase.longURL };
   res.render('urls_show', { 
     templateVars: templateVars,
     urlDatabase: urlDatabase
   });
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// req.params: [
//   { shortURL: 'b2xVn2', longURL: 'http://www.lighthouselabs.ca' },
//   { shortURL: '9sm5xK', longURL: 'http://www.google.com' }
// ];
// res.send(req.params);