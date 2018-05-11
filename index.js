'use strict';

const fs = require('fs');
const path = require('path');
//const request = require('request');


exports.get = function(event, context, callback) {
  //let contents = fs.readFileSync(`public${path.sep}index.html`);
  console.log(checkQuery(event.query))
  let result = {
    statusCode: 200,
    body: checkQuery(event.query),
    headers: {'content-type': 'text/html'}
  };

  callback(null, result);
};
function checkQuery(query){ //check is query project_type : PRJNA012312 ERP12312 mgp100231
	let reProject = new RegExp("(^PRJ(NA|EB|DA|DB)[0-9]+|^(E|S|D)RP[0-9]+|^mgp[0-9]+)","g");
	return reProject.test(query)
}
