var Promise = require('bluebird');
var bcrypt = require('bcrypt-nodejs');

module.exports = function(Sequelize, sequelize) {
  return sequelize.define('user', {
    username: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    password: Sequelize.STRING,
    email: Sequelize.STRING
  }, {
    hooks: {
      beforeCreate: function(user, options) {
        user.password = bcrypt.hashSync(user.password);
      }
    },
    instanceMethods: {
      verifyPassword: function(password) {
        return new Promise(function(resolve, reject) {
          bcrypt.compare(password, this.password, function(err, res) {
              console.log(err,res);
            if(err) {
              return reject(err);
            }
            resolve(res);
          })
        });
      }
    }
  });
};
