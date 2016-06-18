module.exports = function(Sequelize, sequelize) {
  return sequelize.define('database', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      unique: 'comp1'
    },
    type: {
      type: Sequelize.ENUM,
      values: ['mariadb', 'mongodb', 'postgres'],
      unique: 'comp1'
    }
  });
};
