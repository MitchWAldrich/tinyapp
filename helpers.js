// Error handler that renders a page consistant with the site's layout and delivers a specific error message to the user
const errorHandler = function(res, errorCode, errorMessage, user) {
  const templateVars = { errorCode, errorMessage, user }
  res.render('urls_error', templateVars);
}

// Returns the user using the e-mail stored in the users database
const getUserByEmail = function(email, users) {
  for (const user in users) {
    if (email === users[user].email) {
      return user;
    }
  }
}

// Returns the URLs saved to a user's page
const urlsForUser = function(id, database) {
  let usersURLS = {};
  for (const url in database) {
    if (database[url].userID === id) {
      usersURLS[url] = database[url].longURL;
    }
  }
  return usersURLS;
}

// Returns and confirms the proper e-mail assosciated with a user's account
const emailLookUp = function(email, users) {
  for (const user in users) {
    if (email === users[user].email) {
      return email;
    }
  }
}

// Returns a shortURL listed in the database
const shortUrlLookUp = function(shortURL, database) {
  for (const url in database) {
    if (shortURL === url) {
      return shortURL;
    }
  }
}

// Generates a random string of upper and lower case letters as well as numbers to create a unique shortURL
const generateRandomString = function(numOfChars) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomShortURL = '';
  const charactersLength = characters.length;
  for (let i = 0; i < numOfChars; i++) {
    randomShortURL += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return randomShortURL;
};

module.exports = { 
  errorHandler,
  getUserByEmail,
  urlsForUser,
  emailLookUp,
  shortUrlLookUp,
  generateRandomString
};
