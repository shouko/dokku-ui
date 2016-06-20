module.exports = {
  loggedIn: function(req, res, next) {
    if(req.session.user.username) {
      return next();
    }
    res.redirect('/');
  }
};
