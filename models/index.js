module.exports = function(Sequelize, sequelize) {
  var User = require('./user.js')(Sequelize, sequelize);
  var App = require('./app.js')(Sequelize, sequelize);
  var AppUser = require('./app_user.js')(Sequelize, sequelize);
  var AppDatabase = require('./app_database.js')(Sequelize, sequelize);
  var Database = require('./database.js')(Sequelize, sequelize);
  var Key = require('./key.js')(Sequelize, sequelize);
  User.hasMany(Key);
  User.belongsToMany(App, { through: AppUser });
  App.belongsToMany(User, { through: AppUser });
  Database.belongsToMany(App, { through: AppDatabase });
  App.belongsToMany(Database, { through: AppDatabase });
  return {
    User: User,
    App: App,
    Key: Key,
    Database: Database
  };
};
