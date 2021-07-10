const errorHandler = function(res, errorCode, errorMessage, user) {
  const templateVars = { errorCode: errorCode, errorMessage: errorMessage, user: user}
  res.render('urls_error', templateVars);
}

const getUserByEmail = function(email, users) {
  for (const user in users) {
    if (email === users[user].email) {
      // console.log(user)
      return user;
    }
  }
}

const urlsForUser = function(id, database) {
  let usersURLS = {};
  for (const url in database) {
    // console.log(url);
    if (database[url].userID === id) {
      usersURLS[url] = database[url].longURL;
    }
  }
  // console.log(usersURLS)
  return usersURLS;
}

const emailLookUp = function(email, users) {
  for (const user in users) {
    if (email == users[user].email) {
      return email;
    }
  }
}


module.exports = { 
  errorHandler,
  getUserByEmail,
  urlsForUser,
  emailLookUp
};
