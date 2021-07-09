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

// const noInputError = function(res) {
//   const templateVars = { errorCode: 400, errorMessage: 'no e-mail or password entered', user: undefined}
//   res.render('urls_error', templateVars);
// }



module.exports = { 
  errorHandler,
  getUserByEmail
  // noInputError 
};
