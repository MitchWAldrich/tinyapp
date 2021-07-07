const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const generateRandomString = function(numOfChars) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomShortURL = '';
  const charactersLength = characters.length;
  for (let i = 0; i < numOfChars; i++) {
    randomShortURL += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return randomShortURL;
};

const urlDatabase = {
  'b2xVn2': {shortURL: 'b2xVn2', longURL: 'http://www.lighthouselabs.ca'},
  '9sm5xK': {shortURL: '9sm5xK', longURL: 'http://www.google.com'}
};

const userDatabase = [
  { id: 1, name: 'Mitch'}
]

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
  // const shorteningLink = 'Follow this link to shorten your URL:'
  const templateVars = { urlDatabase: urlDatabase, userDatabase, username: req.cookies['username'] };
  res.render('urls_index', templateVars);
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
})

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
})

app.get('/register', (req, res) => {
  const templateVars = { username: req.cookies['username'] };
  res.render('registration', templateVars)
})

app.get('/urls/new', (req, res) => {
  const templateVars = { username: req.cookies['username'] };
  res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  console.log(req.params);  // Log the POST request body to the console
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {shortURL: shortURL, longURL: req.body.longURL};
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/:id', (req, res) => {
  const id = req.params.id;
  const templateVars = { shortURL: id, longURL: urlDatabase[id].longURL, userDatabase, username: req.cookies['username']};
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res,) => {
  const id = req.params.id;
  urlDatabase[id] = {shortURL: id, longURL: req.body.longURL};
  res.redirect(`/urls/${id}`);
});

app.post('/urls/:id/delete', (req, res,) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls/`);
});

app.post('/urls/:id', (req, res,) => {
  const id = req.params.id;
  urlDatabase[id] = {shortURL: id, longURL: req.body.longURL};
  res.redirect(`/urls/${id}`);
});

app.use(function (req, res){
	res.status(404).render('urls_error');
});

app.get('/u/:shortURL', (req, res) => {
  const id = req.params.shortURL;
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[id] };
  res.redirect(templateVars.longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});