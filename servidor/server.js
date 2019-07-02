//http://www.sebastianseilund.com/json-socket-sending-json-over-tcp-in-node.js-using-sockets

const program = require('commander');
const net = require('net');
const JsonSocket = require('json-socket');
const parse= require('../librerias/json-fn').parse;

/*
* Configuración de los parametros del servidor
*/

program
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-p, --port <number>', 'Socket port', parseInt)
  .parse(process.argv);


if (typeof program.port === 'undefined') {
   program.help();
   process.exit(1);
}
if (isNaN( program.port)) {
   program.help();
   process.exit(1);
}

/*
* Creacion del servidor
*/
var server = net.createServer();
 
server.listen( program.port, function() {
    console.log('ready to go!');
});
server.on('connection', function(socket) { 

    socket = new JsonSocket(socket); 
    socket.setKeepAlive(false);
 
    socket.on('message', function(message) {
      var result;
      try{
      	message=parse(message);
        if(message.tarea.finalizar){
          server.close();
          process.exit();
          console.log("finalizar");
        }else if(message.tarea.principal){
          result = message.tarea.principal(message.datos);
          console.log(result);
        }else{
          result = message.tarea(message.datos);
          console.log(result);
        }
        socket.sendEndMessage({result: result});
      }catch(e){
        socket.sendEndMessage({result: "error:-->"+e});    

      }
    });
});