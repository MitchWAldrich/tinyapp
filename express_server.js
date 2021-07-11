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

// / Page request redirecting to login page, if user not signed in
app.get('/', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }
  if (req.session.user_id) { // redirects to main urls page if user is signed in
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

// GET Login route
app.get('/login', (req, res) => {
  if (req.session.user_id) { //if user is logged in, redirects to user's URLs page
    res.redirect('/urls');
  } else { // else user logs in
    const templateVars = { urlDatabase, users, user: users[req.session.user_id] };
    res.render('login', templateVars);
  }
});

// POST Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!emailLookUp(email, users)) { // Tells user if their email is not found
    errorHandler(res, 403, 'User not found', undefined);
    return;
  }
  
  // Compares password to encrypted password for secure sign in
  const user_id = getUserByEmail(email, users);
  const passwordMatch = bcrypt.compareSync(password, users[user_id].password);
  if (!(users[user_id].password && passwordMatch)) { // redirects if password does not match database
    errorHandler(res, 403, 'Incorrect email or password', undefined);
  } else { //else user signed in and sent to URLs page
    req.session.user_id = user_id; // session id created
    res.redirect('/urls');
  }
});
//End of Login Route

// POST Logout route
app.post('/logout', (req, res) => {
  req.session = null; // deletes session, clearing cookies
  res.redirect('/urls');
});

// GET registration page
app.get('/register', (req, res) => {
  if (req.session.user_id) { // if user is signed in, redirects to urls page
    res.redirect('/urls');
  } else { // else user can register
    const templateVars = { user: users[req.session.user_id] };
    res.render('registration', templateVars);
  }
});

//This is the POST Register Route for capturing the Registration data and then saving it to the DB
app.post('/register', (req, res) => {
  //Generating the Random ID for new User
  const randomUserID = generateRandomString(8);
  const { email, password } = req.body;
  //Generating the Hashed Password from Plain Text Password
  const hashedPassword = bcrypt.hashSync(password, 10);

  //Checking for Validations
  //1. If the email or password is empty
  if (getUserByEmail(email, users)) { //If the email is already taken
    errorHandler(res, 400, 'E-mail already exists in database', undefined);
  } else if (email === '' || password === '') {
    errorHandler(res, 400, 'no e-mail or password entered', undefined);
  } else { //else everything is fine. User can be registered
    users[randomUserID] = { id: randomUserID, email: req.body.email, password: hashedPassword };
    req.session.user_id = randomUserID;
    res.redirect('/urls');
  }
});
// END Of POST REGISTER ROUTE

// GET route for user's personalized URLs page
app.get('/urls', (req, res) => {
  if (!req.session.user_id) { // If not signed in, redirects to log in
    errorHandler(res, 403, 'You are not logged in. Please register or log in to your account.', undefined);
  } else {
    const userURLs = urlsForUser(req.session.user_id, urlDatabase);
    const templateVars = { userURLs, urlDatabase, users, user: users[req.  session.user_id] };
    res.render('urls_index', templateVars);
  }
});

//POST route for URLs, allows users to edit and delete saved URLs
app.post('/urls', (req, res) => {
  if (!req.session.user_id) { // users can only view URLs saved to their account
    errorHandler(res, 403, 'Access forbidden. You are not logged in.', undefined);
    res.redirect('/urls_error');
  } else {
    const shortURL = generateRandomString(6);
    urlDatabase[shortURL] = {userID: req.session.user_id, longURL: req.body.longURL};
    res.redirect(`/urls/${shortURL}`);
  }
});

//GET route to add new shortURLs to user's account
app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) { // if not signed in, redirects to Login
    res.redirect('/login');
  } else {
    const templateVars = { user: users[req.session.user_id], };
    res.render('urls_new', templateVars);
  }
});

//GET route for user's individual shortURLs
app.get('/urls/:id', (req, res) => {
  const id = req.params.id;
  const shortURL = urlDatabase[id];
  if (!shortURL) { // informs user if shortURL does not exist
    errorHandler(res, 404, 'You do not have permission to access this page or the page does not exist.', req.session.user_id);
  } else if (!req.session.user_id) { // if user is not logged in, redirects to Login page
    errorHandler(res, 403, 'You are not logged in. Please register or log in to your account.', undefined);
    return;
  }

  const longURL = urlDatabase[id].longURL;
  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userKeys = Object.keys(userURLs);
  if (userKeys.length === 0) {
    errorHandler(res, 403, 'You do not have permission to access this URL.', req.session.user_id);
  } else if (!(userKeys.includes(id) || userKeys.includes(id) + '?')) { //error and security handling, allows only the user to access their registered shortURLs
    errorHandler(res, 403, 'You do not have permission to access this URL.', req.session.user_id);
  } else { // if user has access, renders the URL page
    const templateVars = { longURL, users, userID: id, user: users[req.session.user_id]};
    res.render('urls_show', templateVars);
  }
});

// PUT request override to allow shortURL editting
app.put('/urls/:id', (req, res, next) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userKeys = Object.keys(userURLs);
  if (!req.session.user_id) { //redirects if user is not logged in
    errorHandler(res, 403, 'You are not logged in. Please register or log in to your account.', undefined);
  } else if (userKeys.length === 0) {
    errorHandler(res, 403, 'You do not have permission to edit this URL.', req.session.user_id);
  } else if (!(userKeys.includes(id) || userKeys.includes(id) + '?')) { // user can only edit URLs registered to their account
    errorHandler(res, 403, 'You do not have permission to edit this URL.', req.session.user_id);
  } else {
    urlDatabase[id] = { userID: req.session.user_id, longURL: longURL };
    res.redirect(`/urls/`);
  }
});

// DELETE request override to delete saved shortURLs
app.delete('/urls/:id/delete', (req, res, next) => {
  const id = req.params.id;
  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userKeys = Object.keys(userURLs);
  if (!req.session.user_id) { // redirects to Login page if user is not logged in
    errorHandler(res, 403, 'You are not logged in. Please register or log in to your account.', undefined);
  } else if (userKeys.length === 0) {
    errorHandler(res, 403, 'You do not have permission to delete this URL.', req.session.user_id);
  } else if (!(userKeys.includes(id) || userKeys.includes(id) + '?')) { // only the user can delete shortURLs registered to their account
    errorHandler(res, 403, 'You do not have permission to delete this URL.', req.session.user_id);
  } else {
    delete urlDatabase[id];
    res.redirect(`/urls/`);
  }
});

//GET route to redirect from the shortURL to its corresponding longURL page
app.get('/u/:id', (req, res) => {
  const id = req.params.id;
  if (!shortUrlLookUp(id, urlDatabase)) { // error handling for a non-existent page
    errorHandler(res, 404, 'The website does not exist', undefined);
  } else { //else redirects to the appropriate long URL
    const longURL = urlDatabase[id].longURL;
    res.redirect(`${longURL}`);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});