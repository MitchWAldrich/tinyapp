const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { errorHandler, noInputError } = require('./helpers');

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

const users = {
  'userRandomID': { 
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'example-password'
  },
  'user2RandomID': { 
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'example2-password2'
  },
}

const emailLookUp = function(email) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }  
  }  
}

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
  const templateVars = { urlDatabase: urlDatabase, users, user: users[req.cookies['user_id']] };
  res.render('urls_index', templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = { urlDatabase: urlDatabase, users, user: users[req.cookies['user_id']] };
  res.render('login', templateVars)
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render('registration', templateVars)
});

app.post('/register', (req, res) => {
  let randomUserID = generateRandomString(8);
  let email = req.body.email;
  let password = req.body.password;
  if (email === "" || password === "") {
    // res.status(400).send('no e-mail or password entered')
    errorHandler(res, 400, 'no e-mail or password entered', undefined);
    return
    // console.log(`users: ${JSON.stringify(users)}`)
  }
  if (emailLookUp(email)) {
    // res.status(400).send('E-mail already exists in database')
    errorHandler(res, 400, 'E-mail already exists in database', undefined);
    return
  } else {
  users[randomUserID] = { id: randomUserID, email: req.body.email, password: req.body.password };
  // console.log(JSON.stringify(users))
  res.cookie('user_id', randomUserID);
  res.redirect('/urls');
  }
});

app.get('/urls/new', (req, res) => {
  console.log(req.cookies);
  const templateVars = { user: users[req.cookies['user_id']], };
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
  const templateVars = { shortURL: id, longURL: urlDatabase[id].longURL, users, user: users[req.cookies['user_id']]};
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
  const templateVars = { user: users[req.cookies['user_id']], };
	res.status(404).render('urls_error', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const id = req.params.shortURL;
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[id] };
  res.redirect(templateVars.longURL);
  console.log(templateVars.longURL)
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});