const init=require('./librerias/cliente-fn').init;
const enviar=require('./librerias/cliente-fn').enviar;
const totalHost=require('./librerias/cliente-fn').totalHost;


const fs = require('fs');

var n = 1000000000;
var c = Math.ceil(Math.sqrt(n));
 

var end,start,numEncontrados;

var numerosPrimos = [];
var path="./resultado_primo.txt";


function primo(numero) {

  for (var i = 2; i < numero; i++) {

    if (numero % i === 0) {
      return false;
    }

  }

  return numero !== 1;
}


var miTarea = {
    principal: function (datos){
    	var result=[];
    	for (; datos.inicio < datos.fin;  datos.inicio++) {
    		if (this.primo(datos.inicio)) {
    		   result.push(datos.inicio);
    		}
    	}
    	return result;
	},
	primo: function(numero) {
		for (var i = 0; i < this.numerosPrimos.length; i++) {
		    if (numero % this.numerosPrimos[i] === 0) {
		        return false;
		    }
		}
		return numero !== 1;
	},
	numerosPrimos:numerosPrimos
}

init().then(main);


function main(){
	start = new Date();

	var b=Math.ceil((n-c)/totalHost());
	console.log("bloques -->"+b);

	for (j=2; j < c; j++) {
		if (primo(j)) {
		    numerosPrimos.push(j);
		}
	}
	
	 
	p=[];
	datos={};
	

	for(i=0;i<totalHost();i++){
		console.log("Enviando datos al servidor "+(i+1));
		datos["inicio"]=c+b*(i)+1;
		datos["fin"]=c+b*(i+1);
		console.log(datos["inicio"]+" / "+datos["fin"]);
		p.push(enviar(i%totalHost(), miTarea, datos));
	}
	 
	Promise.all(p).then(values => { 
		end = new Date() - start;
		numEncontrados= numerosPrimos.length;
		console.info('Tiempo de ejecución: %dms', end)
		try {
			fs.writeFileSync(path, JSON.stringify(numerosPrimos))
			for(i=0;i<values.length;i++){
				fs.appendFileSync(path, JSON.stringify(values[i].result))
				numEncontrados= numEncontrados+ values[i].result.length;
			}
			console.log("Total numeros primos enocntrados "+ numEncontrados);
		} catch (err) {
		    console.error(err)
		}

	  process.exit(4); 
	});
	
}