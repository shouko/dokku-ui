module.exports = function(Sequelize, sequelize) {
  return sequelize.define('user', {
    username: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    password: Sequelize.STRING,
    email: Sequelize.STRING
  });
};
