const errorHandler = function(res, errorCode, errorMessage, user) {
  const templateVars = { errorCode: errorCode, errorMessage: errorMessage, user: user}
  res.render('urls_error', templateVars);
}

const getUserByEmail = function(email, users) {
  for (const user in users) {
    if (email === users[user].email) {
      return user;
    }
  }
}

const urlsForUser = function(id, database) {
  let usersURLS = {};
  for (const url in database) {
    if (database[url].userID === id) {
      usersURLS[url] = database[url].longURL;
    }
  }
  return usersURLS;
}

const emailLookUp = function(email, users) {
  for (const user in users) {
    if (email === users[user].email) {
      return email;
    }
  }
}

const shortUrlLookUp = function(shortURL, database) {
  for (const url in database) {
    if (shortURL === url) {
      return shortURL;
    }
  }
}

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
