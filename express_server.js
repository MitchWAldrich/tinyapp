const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
const { errorHandler, getUserByEmail } = require('./helpers');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');


const salt = bcrypt.genSaltSync(10);
bcrypt.hashSync("", salt);


app.use(bodyParser.urlencoded({extended:true}));
// app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

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
  'b2xVn2': {userID: 'userRandomID', longURL: 'http://www.lighthouselabs.ca'},
  '9sm5xK': {userID: 'userRandomID', longURL: 'http://www.google.com'}
};

const users = {
  'userRandomID': { 
    id: 'userRandomID',
    email: 'user@example.com',
    password: bcrypt.hashSync("example-password", salt)
  },
  'user2RandomID': { 
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: bcrypt.hashSync("example2-password2", salt)
  },
}

// const userObjectLookUp = function(email) {
//   for (const user in users) {
//     if (email === users[user].email) {
//       return users[user];
//     }  
//   }  
// }

// const getUserByEmail = function(email, users) {
//   for (const user in users) {
//     if (email === users[user].email) {
//       return user;
//     }
//   }
// }

// const passwordLookUp = function(email) {
//   for (const user in users) {
//     if (email === users[user].email) {
//       return users[user].password;
//     }
//   }
// }

// const emailLookUp = function(email) {
//   for (const user in users) {
//     if (email === users[user].email) {
//       return email;
//     }
//   }
// }

// const checkUserExists = function(user_id) {
//   for (const user in users) {
//     if (user === user_id) {
//       return true;
//     }
//   }
// }

const urlsForUser = function(id) {
  let usersURLS = {};
  for (const url in urlDatabase) {
    // console.log(url);
    if (urlDatabase[url].userID === id) {
      usersURLS[url] = urlDatabase[url].longURL;
    }
  }
  // console.log(usersURLS)
  return usersURLS;
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
  // console.log('cookie:', req.session.user_id)
  if (!req.session.user_id) {
    errorHandler(res, 403, 'You are not logged in. Please register or log in to your account.', undefined);
    return;
  }
  const userURLs = urlsForUser(req.session.user_id);
  // console.log('users', users)
  
  const templateVars = { userURLs, urlDatabase: urlDatabase, users, user: users[req.session.user_id] };
  res.render('urls_index', templateVars)
});

app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { urlDatabase: urlDatabase, users, user: users[req.session.user_id] };
  res.render('login', templateVars)
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user_id = getUserByEmail(email, users);

  const passwordMatch = bcrypt.compareSync(password, users[user_id].password);
  if (!(users[user_id] && passwordMatch)) {
    errorHandler(res, 403, 'Incorrect email or password', getUserByEmail(email, users));
    return
  }
  // if (!emailLookUp(email)) {
  // }
  // if (passwordLookUp(email) !== password) {
  //   errorHandler(res, 403, 'Incorrect password', getUserByEmail(email, users));
  //   return
  // }
  // bcrypt.compareSync('password', hashedPassword);
  req.session.user_id = user_id;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  delete req.session.user_id;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render('registration', templateVars)
});

app.post('/register', (req, res) => {
  let randomUserID = generateRandomString(8);
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email === "" || password === "") {
    // res.status(400).send('no e-mail or password entered')
    errorHandler(res, 400, 'no e-mail or password entered', undefined);
    return
    // console.log(`users: ${JSON.stringify(users)}`)
  }
  if (getUserByEmail(email, users)) {
    // res.status(400).send('E-mail already exists in database')
    errorHandler(res, 400, 'E-mail already exists in database', undefined);
    return
  } else {
  users[randomUserID] = { id: randomUserID, email: req.body.email, password: hashedPassword };
  // console.log('userInput', users[randomUserID])
  // console.log('randomUserID', randomUserID)
  // console.log('email', req.body.email)
  // console.log('password', hashedPassword)
  // console.log('database', users)
  // console.log(JSON.stringify(users))
  req.session.user_id = randomUserID;
  res.redirect('/urls');
  }
});

app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }
  console.log(req.cookies);
  const templateVars = { user: users[req.session.user_id], };
  res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    errorHandler(res, 403, 'Access forbidden. You are not logged in.', undefined);
    res.redirect('/urls_error');
    return;
  }
  // console.log(req.params);  // Log the POST request body to the console
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {userID: req.session.user_id, longURL: req.body.longURL};
  console.log('test', urlDatabase[shortURL])
  console.log('test2', req.body.longURL)
  console.log('database', urlDatabase)
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/:id', (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  if (!req.session.user_id) {
    errorHandler(res, 403, 'You are not logged in. Please register or log in to your account.', undefined);
    return;
  }
  const userURLs = urlsForUser(req.session.user_id);
  const userKeys = Object.keys(userURLs);
  if (userKeys.length === 0) {
    errorHandler(res, 403, 'You do not have permission to access this URL.', req.session.user_id);
    return;
  }
  if (!(userKeys.includes(id) || userKeys.includes(id) + '?')) {
    errorHandler(res, 403, 'You do not have permission to access this URL.', req.session.user_id);
    return;
  }
  // console.log('userKeys', userKeys)
  // console.log('userURLs', userURLs)
  // console.log('id', id)
  const templateVars = { userID: id, longURL: longURL, users, user: users[req.session.user_id]};
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  const userURLs = urlsForUser(req.session.user_id);
  const userKeys = Object.keys(userURLs);
  if (userKeys.length === 0) {
    errorHandler(res, 403, 'You do not have permission to edit this URL.', req.session.user_id);
    return;
  }
  if (!(userKeys.includes(id) || userKeys.includes(id) + '?')) {
    errorHandler(res, 403, 'You do not have permission to edit this URL.', req.session.user_id);
    return;
  }
  urlDatabase[id] = { userID: req.session.user_id, longURL: longURL };
  res.redirect(`/urls/${id}`);
});

app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  const userURLs = urlsForUser(req.session.user_id);
  const userKeys = Object.keys(userURLs);
  if (userKeys.length === 0) {
    errorHandler(res, 403, 'You do not have permission to delete this URL.', req.session.user_id);
    return;
  }
  if (!(userKeys.includes(id) || userKeys.includes(id) + '?')) {
    errorHandler(res, 403, 'You do not have permission to delete this URL.', req.session.user_id);
    return;
  }
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