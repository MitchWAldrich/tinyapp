const errorHandler = function(res, errorCode, errorMessage, user) {
  const templateVars = { errorCode: errorCode, errorMessage: errorMessage, user: user}
  res.render('urls_error', templateVars);
}

const noInputError = function(res) {
  const templateVars = { errorCode: 400, errorMessage: 'no e-mail or password entered', user: undefined}
  res.render('urls_error', templateVars);
}



module.exports = { 
  errorHandler,
  noInputError };
