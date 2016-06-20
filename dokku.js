var config = require('./config');
var child_process = require('child_process');

module.exports = function(args, input) {
  var result = child_process.spawnSync('ssh', ['-i', config.identity, 'dokku@' + config.dokku_host].concat(args), {
    input: input
  });
  console.log('ssh', result);
  var output = '';
  result.output.forEach(function(buf) {
    if(Buffer.isBuffer(buf)) {
      output += buf.toString();
    }
  });
  return output;
};
