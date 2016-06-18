module.exports = function(Sequelize, sequelize) {
  return sequelize.define('app', {
    name: {
      type: Sequelize.STRING,
      primaryKey: true
    }
  });
};
