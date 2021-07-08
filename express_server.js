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
  'b2xVn2': {userID: 'b2xVn2', longURL: 'http://www.lighthouselabs.ca'},
  '9sm5xK': {userID: '9sm5xK', longURL: 'http://www.google.com'}
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

const userObjectLookUp = function(email) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }  
  }  
}

const userLookUp = function(email) {
  for (const user in users) {
    if (email === users[user].email) {
      return user;
    }
  }
}

const passwordLookUp = function(email) {
  for (const user in users) {
    if (email == users[user].email) {
      return users[user].password;
    }
  }
}

const emailLookUp = function(email) {
  for (const user in users) {
    if (email == users[user].email) {
      return email;
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
  // console.log('cookie:', req.cookies.user_id)
  const templateVars = { urlDatabase: urlDatabase, users, user: users[req.cookies['user_id']] };
  res.render('urls_index', templateVars);
});

app.get('/login', (req, res) => {
  if (req.cookies.user_id) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { urlDatabase: urlDatabase, users, user: users[req.cookies['user_id']] };
  res.render('login', templateVars)
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user_id = userLookUp(email);
  // console.log('email', email)
  // console.log('password', password)
  if (!emailLookUp(email)) {
    errorHandler(res, 403, 'User not found', userLookUp(email));
    return
  }
  if (passwordLookUp(email) !== password) {
    // console.log('email', emailLookUp(email))
    // console.log('password', passwordLookUp(email))
    errorHandler(res, 403, 'Incorrect password', userLookUp(email));
    return
  }
  // const username = req.body.username;
  res.cookie('user_id', user_id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  if (req.cookies.user_id) {
    res.redirect('/urls');
    return;
  }
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
  if (userObjectLookUp(email)) {
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
  if (!req.cookies.user_id) {
    res.redirect('/login');
    return;
  }
  console.log(req.cookies);
  const templateVars = { user: users[req.cookies['user_id']], };
  res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  if (!req.cookies.user_id) {
    errorHandler(res, 403, 'Access forbidden. You are not logged in.', undefined);
    res.redirect('/urls_error');
    return;
  }
  console.log(req.params);  // Log the POST request body to the console
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {userID: shortURL, longURL: req.body.longURL};
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/:id', (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  console.log('body', res.body)
  const templateVars = { userID: id, longURL: longURL, users, user: users[req.cookies['user_id']]};
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res,) => {
  const id = req.params.id;
  urlDatabase[id] = {userID: id, longURL: req.body.longURL};
  res.redirect(`/urls/${id}`);
});

app.post('/urls/:id/delete', (req, res,) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls/`);
});

app.get('/u/:shortURL', (req, res) => {
  const id = req.params.userID;
  if (!id) {
    errorHandler(res, 404, 'The website does not exist', undefined);
    return
  }
  const templateVars = { userID: req.params.userID, longURL: urlDatabase[id] };
  res.redirect(templateVars.longURL);
  console.log(templateVars.longURL)
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});