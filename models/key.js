module.exports = function(Sequelize, sequelize) {
  return sequelize.define('key', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    value: Sequelize.STRING
  });
};
