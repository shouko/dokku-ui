var config = require('./config');
var child_process = require('child_process');

module.exports = function(args, input) {
  var stdout, stderr;
  child_process.spawnSync('ssh', ['-i', config.identity, 'dokku@' + config.dokku_host].concat(args), {
    input: input,
    stdout: stdout,
    stderr: stderr
  });
  return [stdout, stderr];
};
