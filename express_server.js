const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));

app.set('view engine', 'ejs');

const generateRandomString = function(numOfChars) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomShortURL = ' ';
  const charactersLength = characters.length;
  for (let i = 0; i < numOfChars; i++) {
    randomShortURL += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return randomShortURL;
};

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

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
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', { 
    templateVars,
    shorteningLink
  });
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.post('/urls', (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/:shortURL', (req, res) => {
  const id = req.params.shortURL;
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[id] };
  res.render('urls_show', { templateVars: templateVars });
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// req.params: [
  //   { shortURL: 'b2xVn2', longURL: 'http://www.lighthouselabs.ca' },
  //   { shortURL: '9sm5xK', longURL: 'http://www.google.com' }
  // ];
  // res.send(req.params);
  
  // let shortURL = function() {
  //   for (let key in urlDatabase) {
  //     return key;
  //   }
  // }