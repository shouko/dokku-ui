module.exports = function(Sequelize, sequelize) {
  return sequelize.define('app_user', {
    type: {
      type: Sequelize.ENUM,
      values: ['owner', 'collaborator']
    }
  });
};
