const express = require('express');
const methodOverride = require('method-override');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const { errorHandler, getUserByEmail, urlsForUser, emailLookUp, generateRandomString, shortUrlLookUp } = require('./helpers');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
bcrypt.hashSync('', salt);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// Databases
const urlDatabase = {
  'b2xVn2': {userID: 'userRandomID', longURL: 'http://www.lighthouselabs.ca'},
  '9sm5xK': {userID: 'userRandomID', longURL: 'http://www.google.com'}
};

const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: bcrypt.hashSync('example-password', salt)
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: bcrypt.hashSync('example2-password2', salt)
  },
};

// Page Requests
app.get('/', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// Login and Registration Management
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { urlDatabase, users, user: users[req.session.user_id] };
    res.render('login', templateVars);
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!emailLookUp(email, users)) {
    errorHandler(res, 403, 'User not found', undefined);
    return;
  }

  const user_id = getUserByEmail(email, users);
  const passwordMatch = bcrypt.compareSync(password, users[user_id].password);
  if (!(users[user_id].password && passwordMatch)) {
    errorHandler(res, 403, 'Incorrect email or password', undefined);
  } else {
    req.session.user_id = user_id;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render('registration', templateVars);
  }
});

app.post('/register', (req, res) => {
  const randomUserID = generateRandomString(8);
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === '' || password === '') {
    errorHandler(res, 400, 'no e-mail or password entered', undefined);
  } else if (getUserByEmail(email, users)) {
    errorHandler(res, 400, 'E-mail already exists in database', undefined);
  } else {
    users[randomUserID] = { id: randomUserID, email: req.body.email, password: hashedPassword };
    req.session.user_id = randomUserID;
    res.redirect('/urls');
  }
});

//URL Rendering
app.get('/urls', (req, res) => {
  if (!req.session.user_id) {
    errorHandler(res, 403, 'You are not logged in. Please register or log in to your account.', undefined);
  } else {
    const userURLs = urlsForUser(req.session.user_id, urlDatabase);
    const templateVars = { userURLs, urlDatabase, users, user: users[req.  session.user_id] };
    res.render('urls_index', templateVars);
  }
});

app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    errorHandler(res, 403, 'Access forbidden. You are not logged in.', undefined);
    res.redirect('/urls_error');
  } else {
    const shortURL = generateRandomString(6);
    urlDatabase[shortURL] = {userID: req.session.user_id, longURL: req.body.longURL};
    res.redirect(`/urls/${shortURL}`);
  }
});

app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    const templateVars = { user: users[req.session.user_id], };
    res.render('urls_new', templateVars);
  }
});

app.get('/urls/:id', (req, res) => {
  const id = req.params.id;
  const shortURL = urlDatabase[id];
  if (!shortURL) {
    errorHandler(res, 404, 'The website does not exist', req.session.user_id);
  } else if (!req.session.user_id) {
    errorHandler(res, 403, 'You are not logged in. Please register or log in to your account.', undefined);
    return;
  }

  const longURL = urlDatabase[id].longURL;
  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userKeys = Object.keys(userURLs);
  if (userKeys.length === 0) {
    errorHandler(res, 403, 'You do not have permission to access this URL.', req.session.user_id);
  } else if (!(userKeys.includes(id) || userKeys.includes(id) + '?')) {
    errorHandler(res, 403, 'You do not have permission to access this URL.', req.session.user_id);
  } else {
    const templateVars = { longURL, users, userID: id, user: users[req.session.user_id]};
    res.render('urls_show', templateVars);
  }
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userKeys = Object.keys(userURLs);
  if (!req.session.user_id) {
    errorHandler(res, 403, 'You are not logged in. Please register or log in to your account.', undefined);
  } else if (userKeys.length === 0) {
    errorHandler(res, 403, 'You do not have permission to edit this URL.', req.session.user_id);
  } else if (!(userKeys.includes(id) || userKeys.includes(id) + '?')) {
    errorHandler(res, 403, 'You do not have permission to edit this URL.', req.session.user_id);
  } else {
    urlDatabase[id] = { userID: req.session.user_id, longURL: longURL };
    res.redirect(`/urls/`);
  }
});

app.delete('/urls/:id/delete', (req, res, next) => {
  const id = req.params.id;
  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userKeys = Object.keys(userURLs);
  if (!req.session.user_id) {
    errorHandler(res, 403, 'You are not logged in. Please register or log in to your account.', undefined);
  } else if (userKeys.length === 0) {
    errorHandler(res, 403, 'You do not have permission to delete this URL.', req.session.user_id);
  } else if (!(userKeys.includes(id) || userKeys.includes(id) + '?')) {
    errorHandler(res, 403, 'You do not have permission to delete this URL.', req.session.user_id);
  } else {
    delete urlDatabase[id];
    res.redirect(`/urls/`);
  }
});

app.get('/u/:id', (req, res) => {
  const id = req.params.id;
  if (!shortUrlLookUp(id, urlDatabase)) {
    errorHandler(res, 404, 'The website does not exist', undefined);
  } else {
    const longURL = urlDatabase[id].longURL;
    res.redirect(`${longURL}`);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});