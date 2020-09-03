const database = require('./config/db');
const oracledb = require('oracledb');
const express = require('express');
const xml2string = require('./utils/xml');
const { Message } = require('./models/Message')
const axios = require('axios').default;
const env = require('./config/environment');
const { TM } = require('./models/TM');
const { CK } = require('./models/CK');
const { RE } = require('./models/RE');
const fs = require('fs');
const FormData = require('form-data');

// Initialize Webserver
const app = express();

// Init Middleware
app.use(express.json({ extended: false }));

const PORT = process.env.PORT || 5000;

// Define test route
app.get('/test', async (req, res) => {
    const result = await database.simpleExecute('select user, systimestamp from dual');
    const user = result.rows[0].USER;
    const date = result.rows[0].SYSTIMESTAMP;

    res.end(`DB user: ${user}\nDate: ${date}`);
});

const log = (txt) => {
    console.log(`[${new Date()}] - ${txt}`);
    console.log("==========================================================================================================");
}

app.get('/samples/test-rutine', async (req, res) => {
    log(`Se inicia ciclo.`);

    const endTask = () => {
        res.sendStatus(200)
        log("Ciclo terminado.")
        log("En espera del siguiente ciclo.")
    }

    const tasks = [tmprocess, ckprocess, reprocess, endTask]

    for (const task of tasks) {
        await task();
    }
})

app.get('/samples/reset', async (req, res) => {
    reset().then(result => {
        console.log("RESULTADO => ", result);
        res.sendStatus(200)
    })
})

app.get('/', (req, res) => {
    res.status(200).sendFile(__dirname + '/index.html')
})

app.get('/samples/:type', async (req, res) => {
    const typ = req.params.type.toUpperCase();
    console.log("Solicitud => ", typ)
    if (typ === 'TM' || typ === 'CK' || typ === 'RE' || typ === 'ALL') {
        const stat = req.query.stat;
        oracledb.fetchAsString = [oracledb.CLOB]
        let query = "SELECT * FROM DEVELOPERS.minsal_integracion "

        //? ALL C/ESTADO
        query += typ === 'ALL' && stat !== undefined ? ` WHERE BYTESTADO = ${stat} ` : "";

        //? !ALL S/ESTADO
        query += typ !== 'ALL' ? ` WHERE STRTIPOMENSAJE = '${typ}' ` : "";

        //? !LL C/ESTADO
        query += typ !== 'ALL' && stat !== undefined ? ` AND BYTESTADO = ${stat} ` : "";

        console.log("QUERY => ", query);
        await database.simpleExecute(query, [], { autoCommit: true }).then(async result => {
            log(`Encontrados: ${result.rows.length} resultados.`)
            if (result.rows.length > 0) {
                // Procesar resultados
                const html = buildHTML(result.rows)
                res.send(html)

            } else {
                res.send("No hay registros.")
            }
        }).catch(err => {
            console.log("Ocurrió un error => ", err)
            res.send("Ocurrió un error =>")
        })

    } else {
        res.status(400).json({ "ERROR": "Solicitud mal formulada." })
    }
})

const callMinsalJSON = async (msg, endpoint) => {
    const options = {
        baseURL: env.minsalWS,
        headers: { 'ACCESSKEY': env.akey, 'Content-Type': 'application/json' }
    }

    log(`Preparando llamada a WS ${endpoint}`)
    let data;
    await axios.post(endpoint, [
        msg
    ], options)
        .then(response => {
            data = response
        })
        .catch(error => {
            log(`WS ${endpoint} error => ${error}`)
            data = error.response
        });
    return data
}

const reset = async () => {
    const query = `UPDATE DEVELOPERS.minsal_integracion SET BYTESTADO = 0`;
    await database.simpleExecute(query, [], { autoCommit: true }).then(result => { console.log("Este fue el resultado =>", result.rowsAffected); return result.rowsAffected > 0 }).catch(err => { console.log("Error => ", err); return false })
}

const tmprocess = async () => {
    log('Se inicia proceso CREACIÓN DE MUESTRAS')
    let flag = true;
    //?      - Traer 10 registros de DB tipo TM
    if (flag) {
        oracledb.fetchAsString = [oracledb.CLOB]
        let query = `SELECT * FROM DEVELOPERS.minsal_integracion WHERE STRTIPOMENSAJE = 'TM' AND BYTESTADO = 0`;
        await database.simpleExecute(query, [], { autoCommit: true }).then(async result => {

            log(`Encontrados: ${result.rows.length} resultados.`)
            flag = result.rows.length > 0
            if (flag) {
                log('Se encontraron muestras a crear.')
                for (const msg of result.rows) {
                    console.log(`[${new Date()}] - Creando muestra => `, msg);
                    newmsg = new Message(msg);
                    newjson = JSON.parse(xml2string(msg.STRMENSAJE));
                    verynewjson = new TM(newjson.crearmuestras)
                    newmsg.xmlMSG = verynewjson
                    // newmsg.xmlMSG.codigo_muestra_cliente = Date.now()
                    await callMinsalJSON(newmsg.xmlMSG, '/crearMuestras').then(async result => {
                        log("Finalizada llamada a crearMuestraWS.")
                        if (result.status !== 200) {
                            log(`Error => ${result}`)
                            newmsg.state = -1;
                            newmsg.response = JSON.stringify(result.data)
                        } else {
                            log(`Muestra creada. Respuesta => ${JSON.stringify(result.data[0])}`)
                            newmsg.state = 1;
                            newmsg.minsalSample = result.data[0].id_muestra;
                            newmsg.response = JSON.stringify(result.data[0]);
                        }
                        let query = newmsg.tmUpdateQuery();
                        console.log("UPDATE Query => ", query);
                        database.simpleExecute(query, [], { autoCommit: true }).then(result => {
                            console.log(result);
                            const res = result.rowsAffected > 0 ? "TM actualizado" : "TM NO actualizado";
                            log(`Registro ${newmsg.idmensaje} ${res}`)
                            log(`Proceso finalizado para msg id:${newmsg.idmensaje}`)
                        })
                    }).catch(err => {
                        log('Ocurrió un error al llamar al WS crearMuestras.')
                        console.log(err);
                    })
                };
            } else {
                log('NO se encontraron muestras a crear.')
            }
        }).catch(err => { console.log("Hubo un error => ", err) });
    }

    return null
}

const ckprocess = async () => {
    log('Se inicia proceso RECEPCIÓN DE MUESTRAS')
    let flag = true;
    //?      - Traer 10 registros de DB tipo CK
    if (flag) {
        oracledb.fetchAsString = [oracledb.CLOB]
        let query = `SELECT * FROM DEVELOPERS.minsal_integracion WHERE STRTIPOMENSAJE = 'CK' AND BYTESTADO = 0`;
        await database.simpleExecute(query, [], { autoCommit: true }).then(async result => {
            log(`Encontrados: ${result.rows.length} resultados.`)
            flag = result.rows.length > 0
            if (flag) {
                log('Se encontraron muestras a recepcionar.')
                for (const msg of result.rows) {
                    console.log(`[${new Date()}] - Recepcionando muestra => `, msg);
                    newmsg = new Message(msg);
                    newjson = JSON.parse(xml2string(msg.STRMENSAJE));
                    verynewjson = new CK(newjson.recepcionarmuestra)
                    newmsg.xmlMSG = verynewjson
                    // newmsg.xmlMSG.id_muestra = 7000188084
                    await callMinsalJSON(newmsg.xmlMSG, '/recepcionarMuestra').then(async result => {
                        log("Finalizada llamada a WS recepcionarMuestra.")
                        if (result.status !== 200) {
                            log(`Error => ${result}`)
                            newmsg.state = -1;
                            newmsg.response = JSON.stringify(result.data)
                        } else {
                            log(`Muestra Recepcionada. Respuesta => ${JSON.stringify(result.data[0])}`)
                            newmsg.state = 1;
                            newmsg.response = JSON.stringify(result.data[0]);
                        }
                        let query = newmsg.ckUpdateQuery();
                        console.log("UPDATE Query => ", query);
                        database.simpleExecute(query, [], { autoCommit: true }).then(result => {
                            console.log(result);
                            const res = result.rowsAffected > 0 ? "CK actualizado" : "CK NO actualizado";
                            log(`Registro ${newmsg.idmensaje} ${res}`)
                            log(`Proceso finalizado para msg id:${newmsg.idmensaje}`)
                        })
                    }).catch(err => {
                        log('Ocurrió un error al llamar al WS recepcionarMuestra.')
                        console.log(err);
                    })
                };
            } else {
                log('NO se encontraron muestras a recepcionar.')
            }
        }).catch(err => { console.log("Hubo un error => ", err) });
    }

    return null
}

const reprocess = async () => {
    log('Se inicia proceso ENTREGA DE MUESTRAS')
    let flag = true;
    //?      - Traer 10 registros de DB tipo RE
    if (flag) {
        oracledb.fetchAsString = [oracledb.CLOB]
        let query = `SELECT * FROM DEVELOPERS.minsal_integracion WHERE STRTIPOMENSAJE = 'RE' AND BYTESTADO = 0`;
        await database.simpleExecute(query, [], { autoCommit: true }).then(async result => {
            log(`Encontrados: ${result.rows.length} resultados.`)
            flag = result.rows.length > 0
            if (flag) {
                log('Se encontraron muestras a entregar.')
                for (const msg of result.rows) {
                    console.log(`[${new Date()}] - Entregando muestra => `, msg);
                    newmsg = new Message(msg);
                    newjson = JSON.parse(xml2string(msg.STRMENSAJE));
                    verynewjson = new RE(newjson.entregaresultado)
                    newmsg.xmlMSG = verynewjson
                    // verynewjson.id_muestra = 7000188084
                    await callMinsalMultipart(JSON.stringify(newmsg.xmlMSG), '/entregaResultado', async (result) => {
                        log("Finalizada llamada a WS entregaResultado.")
                        if (result.status !== 200) {
                            log(`Error => ${result}`)
                            newmsg.state = -1;
                            newmsg.response = JSON.stringify(result.data)
                        } else {
                            log(`Resultado entregado. Respuesta => ${JSON.stringify(result.data)}`)
                            newmsg.state = 1;
                            newmsg.response = JSON.stringify(result.data);
                        }
                        let query = newmsg.reUpdateQuery();
                        console.log("UPDATE Query => ", query);
                        database.simpleExecute(query, [], { autoCommit: true }).then(result => {
                            console.log(result);
                            const res = result.rowsAffected > 0 ? "RE actualizado" : "RE NO actualizado";
                            log(`Registro ${newmsg.idmensaje} ${res}`)
                            log(`Proceso finalizado para msg id:${newmsg.idmensaje}`)
                        })
                    }).catch(err => {
                        log('Ocurrió un error al llamar al WS entregaResultado.')
                        log(err);
                    })
                };
            } else {
                log('NO se encontraron muestras a entregar.')
            }
        }).catch(err => { console.log("Hubo un error => ", err) });
    }

    return null
}

const callMinsalMultipart = async (payload, endpoint, callback) => {
    log(`Preparando llamada a WS ${endpoint}`)

    await fs.writeFile('resultado.txt', payload, async (err) => {

        if (err) {
            console.log("Error => ", err);
            return err
        }
        let formData = new FormData();
        const stream = fs.createReadStream(__dirname + '/resultado.txt');

        formData.append('parametros', payload);
        formData.append('upload ', stream, 'resultado.txt');
        let data;
        await formData.getLength(async (err, len) => {
            const formHeaders = formData.getHeaders({ ACCESSKEY: env.akey, 'Content-Length': len });
            console.log("HEADERS", formHeaders);

            log('Llamanda axios')
            await axios.post(endpoint, formData, {
                baseURL: env.minsalWS,
                headers: { ...formHeaders },
                data: formData
            })
                .then(response => {
                    data = response;
                })
                .catch(error => {
                    data = error.response;
                });

            callback(data)
        })
    })
};

const buildHTML = (msgs) => {
    let arrayfinal = "";
    for (let i = 0; i < msgs.length; i++) {
        let base = `<tr><th scope="row">${i + 1}</h>`
        let temp = new Message(msgs[i]);
        let data = temp.getHTML();
        arrayfinal += `${base}${data}</tr>`;
    }
    return `<!DOCTYPE html><html lang="en"><head><link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reporte de Mensajes</title></head>    
    <body><table class="table"><thead>
                <th scope="col">#</th>
                <th scope="col">IDDB</th>
                <th scope="col">IDLAB</th>
                <th scope="col">IDINTERNO</th>
                <th scope="col">FECHA</th>
                <th scope="col">ID MINSAL</th>
                <th scope="col">TIPO</th>
                <th scope="col">CREACIÓN</th>
                <th scope="col">XML</th>
                <th scope="col">ESTADO</th>
                <th scope="col">TIEMPO</th>
                <th scope="col">RESPUESTA</th>
            </thead><tbody>${arrayfinal}</tbody></table></body></html>`;
}

// app.use('/samples', require('./routes/samples'));
// app.use('/users', require('./routes/users'));

// Start webserver
app.listen(PORT, () => {
    console.log(`WebServer iniciado en puerto ${PORT}`);
});
