const init=require('./librerias/cliente-fn').init;
const enviar=require('./librerias/cliente-fn').enviar;
const totalHost=require('./librerias/cliente-fn').totalHost;


const fs = require('fs');
 

var end,start;

 
var path="./resultado_matrices.txt";

var matriz1, matriz2;
var dimension=3000;
var num_filas;

function crea_matriz(nb) {
    var a = new Array(nb); //crea una matriz de longitud nb
    for (var i = 0; i < nb; i++) {
        a[i] = new Array(nb); //define cada elemento como una matriz de longitud nb
        for (var j = 0; j < nb; j++) {
            a[i][j] = (i + 1) * (j + 1); //asigna a cada elemento de la matriz bidimensional 
			                                      
        }
    }
    return a;
}

function multiplica_matrices(matrices) {
    var m1 = matrices["a"];
    var m2 = matrices["b"];
    var result = [];
    for (var i = 0; i < m1.length; i++) {
        result[i] = [];
        for (var j = 0; j < m2[0].length; j++) {
            var sum = 0;
            for (var k = 0; k < m1[0].length; k++) {
                sum += m1[i][k] * m2[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}
 
function suma_matirz(dato) {

    for (var i = 0; i < dato.length; i++) {
        for (var j = 0; j < dato[i].length; j++) {
            dato[i][j] = dato[i][j] + dato[i][j];
        }
    }
    return dato;
}


 

init().then(main);


function main(){
	
	//creamos las matrices
	matriz1 = crea_matriz(dimension);
	matriz2 = crea_matriz(dimension);
	//calculamos el reparto
	num_filas=Math.ceil(dimension/totalHost());
	 
	//vector de promesas
	p=[];
	//datos de la tarea
	datos={};
	datos["a"]=[];
	datos["b"]=matriz2;
	start = new Date();
	//creamos los valores a enviar y enviamos la tarea
	for(i=0;i<totalHost();i++){
		console.log("creando datos para la primera tarea");
		for(j=0;j<num_filas&&j+(i*num_filas)<dimension;j++){
			datos["a"].push(matriz1[j+(i*num_filas)]);
		}

		console.log("Enviando datos al servidor "+(i+1)+" "+datos["a"].length+" filas");
		p.push(enviar(i%totalHost(), multiplica_matrices, datos));
		datos["a"]=[];
	}
	 
	Promise.all(p).then(values => { 
		end = new Date() - start;
		 
		console.info('Tiempo de ejecución: %dms para la dimensión %d', end,dimension);
		try {
			fs.writeFileSync(path, "Solución:\n")
			for(i=0;i<values.length;i++){
				fs.appendFileSync(path, JSON.stringify(values[i].result))
				 
			}
			 
		} catch (err) {
		    console.error(err)
		}

	  process.exit(4); 
	});
 
}