 
const Q = require('q');
const net = require('net');
const JsonSocket = require('json-socket');
const stringify= require('../librerias/json-fn').stringify;
const portfinder = require('portfinder');
const exec = require('child_process').exec;
const program = require('commander');
const fs = require("fs");
//variable para guardar los host que van a realizar las tareas
var hostsActivos=[];
//numero de host
var numHosts=0;
function enviar(numero, tarea,datos) {

	if(numero>=numHosts){
		console.log("Error, no existe un servidro con ese numero");
		process.exit(1);
	}

	return enviar_tarea(hostsActivos[numero].ip, hostsActivos[numero].puerto, tarea,datos);
}

function enviar_tarea(host, port, tarea,datos) {
	var deferred = Q.defer();
 	//la convertimos en texto
	var str = stringify({  'tarea': tarea, 'datos':datos});
	//console.log(str);
 	var socket = new JsonSocket(new net.Socket()); //Decorate a standard net.Socket with JsonSocket
 	 
	socket.connect(port, host);
	socket.on('connect', function() { //Don't send until we're connected
    	socket.sendMessage(str);
    	socket.on('message', function(message) {
        	deferred.resolve(message);
        	socket.end();
    	});
    	socket.on('error', function (err) {
    		deferred.reject(err);
    	});
    	socket.on("close", function () {
			//console.log("socket closed");
		});
    	

	});
	socket.on('error', function (exc) {
    	console.log("ignoring exception: " + exc);
    	deferred.reject(exc);
	});
	return deferred.promise;
}



function crear_servidor(puerto) {
	var deferred = Q.defer();
	var host = [];
	 
	host["ip"]="127.0.0.1";
	host["puerto"]=puerto;
	var proceso_servidor=exec('node ./servidor/server.js -p '+puerto, (e, stdout, stderr)=> {
		    if (e instanceof Error) {
		        deferred.reject(e);
		    }
		});
	host["proceso"]=proceso_servidor;
	proceso_servidor.stdout.on('data', function (data) {
		deferred.resolve(host);
		//console.log('Servidor ' + data.toString());
	});
	return deferred.promise;
}

function crear_servidores(puertos){
	var p = [];

	var deferred = Q.defer();
	for (var n = 0; n <puertos.length; n++) {
		p.push(crear_servidor(puertos[n]));
	}
	Promise.all(p).then(function(results) {
		hostsActivos=results;
    	deferred.resolve(results);
	}).catch(function(reason) {
   		deferred.reject(reason);
	});
	return deferred.promise;
}
 
 

function init(){
	var deferred = Q.defer();
	program
	  .version('1.0.0', '-v, --version')
	  .usage('[OPTIONS]...')
	  .option('-n, --number <number>', 'Number of processes', parseInt)
	  .option('-f, --file <name>', 'host address file')
	  .parse(process.argv);

	if (typeof program.number === 'undefined') {
		program.help();
	  	process.exit(1);
	}
	if (isNaN( program.number)) {
	  	program.help();
	  	process.exit(1);
	}
	numHosts=program.number;
	if (typeof program.file === 'undefined' && isNaN( program.file)) {
	  	//crear servidores
	  	portfinder.getPorts(numHosts, {
	    port: 14000,    // minimum port
	    stopPort: 15000 // maximum port
		}, function(err, puertos){
			if(err!=null){
				console.log("Error al buscar los puertos -->"+err);
				process.exit(1);
			}
			crear_servidores(puertos).then(function(host){
				//console.log('ready to go!');
				deferred.resolve("ok");
			}).catch(function(reason) {
				console.log("Error al crear los servidores -->"+reason);
				process.exit(1);
			});
		});
	  	 
	}else{
		try{
			var contents = fs.readFileSync(program.file);
	  		var jsonContent = JSON.parse(contents);
		}catch(e){
				console.log("Error al leer el fichero -->"+e);
				process.exit(1);
		}
	  	console.log("Cargando datos servidores");
	  	for (var i = jsonContent.length - 1; i >= 0; i--) {
	  		hostsActivos.push({
	  			"ip":jsonContent[i].host,
	  			"puerto":jsonContent[i].port,
	  			 
	  		});
	  	}
	  	//console.log('ready to go!');
		deferred.resolve("ok");
	}
	process.on('exit', function (){
		 
	 	for (var i = hostsActivos.length - 1; i >= 0; i--) {
	 		finServer={
	 			finalizar:function(){}
	 		}
	 		if(hostsActivos[i]["proceso"] && hostsActivos[i]["proceso"] !== 'undefined' && hostsActivos[i]["proceso"] !== null)
	 			//hostsActivos[i]["proceso"].kill();
	 			//console.log(hostsActivos[i]["proceso"].pid);
	 			//como eliminar de forma manual
	 			//var os = require('os');
				//console.log("Platform: " + os.platform());
	 			//console.log(hostsActivos[i]["proceso"].pid);
	 		 	//exec('taskkill /F /pid '+hostsActivos[i]["proceso"].pid);
	 		 	//console.log(hostsActivos[i]["proceso"]);
	 		 	enviar(i, finServer,null).then(function(){
	 		 		hostsActivos[i]["proceso"].kill();
	 		 	})
	 		 	

	 	}
	 	console.log('good bye!');
	});
	return deferred.promise;
}
function totalHost(){
	return numHosts;
}
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', reason.stack || reason)
  // Recommended: send the information to sentry.io
  // or whatever crash reporting service you use
})

exports.init = init;
exports.enviar = enviar;
exports.totalHost=totalHost;