'use strict'
const _ = require('lodash');
const request = require('request');
var fs = require('fs');
var path = require('path');

exports.get = (event, context, callback) => {
  if(checkQuery(event.query)==true){
    getProject(event.query,function(val){
        let result = {
            statusCode:200,
            body:val.toString(),
            headers:{'content-type':'text/json'}
        };
        callback(null,result);
    })
  }
  //callback(null, result);
};


function checkQuery(query){ //check is query project_type : PRJNA012312 ERP12312 mgp100231
	let reProject = new RegExp("(^PRJ(NA|EB|DA|DB)[0-9]+|^(E|S|D)RP[0-9]+|^mgp[0-9]+)","g");
	return reProject.test(query)
}


function getProject(query,callback){ //return project which query(sample) contained... //this is how you return value....haha
	let reNCBI = new RegExp("((E|S|D)R(R|S)[0-9]+|^(E|S|D)RP[0-9]+|^PRJ(NA|EB|DA|DB)[0-9]+)","g");
	let reMGRAST = new RegExp("(mg(m|s)[0-9]+\.3|^mgp[0-9]+)");
	let result = {};
	if(reNCBI.test(query)==true){ //from sample //it's ncbi --> @ mg-rast branch...
		request.get("https://www.ncbi.nlm.nih.gov/Traces/study/?acc="+query+"&go=go",function(error,response,body){
			console.log('[INFO] status: ',response && response.statusCode);
			let keyRe=new RegExp("\{key:\"[0-9,a-z]+\", mode:\"[a-z]+\"\}","g");
			try{
				let key = keyRe.exec(body)[0] //parse key from body..
				let key_rep = JSON.parse(key.replace('key','\"key\"').replace('mode','\"mode\"'))
				//console.log("[INFO] sample_key: "+key_rep.key );
			
				let OPTIONS = { 
					// url from run_selector
					url: "https://www.ncbi.nlm.nih.gov/Traces/study/proxy/run_selector.cgi?wt=json&indent=true&omitHeader=true&", 
					headers:{'Content-Type':'application/json'},
					body:'q=recordset:'+key_rep.key
				}

				request.post(OPTIONS,function(err,req,res){
					let meta=JSON.parse(res).response.docs[0]
					console.log(meta)
					console.log("[INFO]\tPROJECT: "+meta.BioProject_s+"\n\tAlias: "+meta.SRA_Study_s);//+project);
					console.log("[INFO]\tPROJECT_NAME: "+meta.project_name_s)
					let out = {'project':meta.BioProject_s,'alias':meta.SRA_Study_s,'project_name':meta.project_name_s};
					return callback(JSON.stringify(out));
				});
			}catch(err){
				console.log("[ERROR] no accession! try again")
				return callback(JSON.stringify("[ERROR] no accession! try again"))
			}
		});

	}else if(reMGRAST.test(query)==true){
		console.log("MG_RAST");
		request.get("https://api-ui.mg-rast.org/search?all="+query,function(err,res,body){
			try{
				let MGproject = JSON.parse(body).data[0]; //check you can find pmid in this query...
				console.log("[INFO]\tPROJECT: " + MGproject.project_id);
				console.log("[INFO]\tPROJECT_NAME: "+MGproject.project_name+" \n\tPMID: "+MGproject.pubmed_id) 
				let out = {'project':MGproject.project_id,'project_name':MGproject.project_name,'pmid':MGproject.pubmed_id};
				return callback(JSON.stringify(out));
				
			}catch(err){
				console.log("[ERROR] no accession! try again");
				return callback(JSON.stringify("[ERROR] no accession! try again"))
			}
		})
	
		
	}else{
		console.log("[ERROR] wrong type! try again");
		return callback("[ERROR] wrong type! try again")
	}
}
