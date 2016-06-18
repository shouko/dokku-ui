module.exports = {
  loggedIn: function(req, res, next) {
    if(req.session.username) {
      return next();
    }
    res.redirect('/');
  }
};
