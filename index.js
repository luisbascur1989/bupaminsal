const database = require('./config/db');
const oracledb = require('oracledb');
const express = require('express');
const xml2string = require('./utils/xml');
const { Message } = require('./models/Message')
const axios = require('axios').default;
const env = require('./config/environment');
const { TM } = require('./models/TM');

// Initialize Webserver
const app = express();
const options = {
    baseURL: env.minsalWS,
    headers: { 'ACCESSKEY': env.akey, 'Content-Type': 'application/json' }
}

// Connect to DB
// database.connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

const PORT = process.env.PORT || 5000;

// app.get('/', (req, res) => {
//     res.send('API RUNNING');
// });

// Define test route
app.get('/test', async (req, res) => {
    const result = await database.simpleExecute('select user, systimestamp from dual');
    const user = result.rows[0].USER;
    const date = result.rows[0].SYSTIMESTAMP;

    res.end(`DB user: ${user}\nDate: ${date}`);
});

// app.get('/samples/:type', async (req, res) => {
//     oracledb.fetchAsString = [oracledb.CLOB]

//     const query = `SELECT * FROM DEVELOPERS.minsal_integracion WHERE STRTIPOMENSAJE = '${req.params.type.toUpperCase()}'`
//     const result = await database.simpleExecute(query);

//     if (result.rows.length === 0)
//         console.error("No results");
//     else {
//         const clob = result.rows[0];
//         console.log("CLOB =>", clob);
//     }
//     let msgs = new Array();
//     result.rows.forEach(msg => {
//         console.log(msg);
//         msgs.push(JSON.parse(xml2string(msg.STRMENSAJE)))
//     });

//     res.send(msgs);
// })

const log = (txt) => {
    console.log(`[${new Date()}] - ${txt}`);
    console.log("==========================================================================================================");
}

app.get('/samples/test-rutine', async (req, res) => {
    //TODO 1. Crear muestras en minsal
    log(`Se inicia el proceso.`);
    await tmprocess().then(async () => {
        // //TODO 2. Recepcionar muestras
        // await ckprocess().then(() => {
        //     //TODO 3. Entregar Resultados
        //     //?     - Traer 10 registros de DB tipo RE
        // })
    })
    res.sendStatus(200)
    log("EN ESPERA DEL SIGUIENTE CICLO.")
})

app.get('/samples/reset', async (req, res) => {
    reset().then(result => {
        console.log("RESULTADO => ", result);
        res.sendStatus(200)
    })
})

const createSample = async (msg) => {
    log("Preparando llamada a WS crearMuestras")
    const newid = Date.now();
    msg.codigo_muestra_cliente = newid
    let data;
    await axios.post('/crearMuestras', [
        msg
    ], options)
        .then(response => {
            data = response
        })
        .catch(error => {
            log(`crearMuestraWS error => ${error}`)
            data = error
        });
    return data
}

const deliverSample = async (msg) => {
    let data;
    await axios.post('/recepcionarMuestra', [
        msg
    ], options)
        .then(response => {
            data = response.data
        })
        .catch(error => {
            data = error
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
        // let query = `SELECT COUNT(*) FROM DEVELOPERS.minsal_integracion`;
        let query = `SELECT * FROM DEVELOPERS.minsal_integracion WHERE STRTIPOMENSAJE = 'TM' AND BYTESTADO = 0`;
        database.simpleExecute(query, [], { autoCommit: true }).then(async result => {
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
                    await createSample(newmsg.xmlMSG).then(async result => {
                        log("Finalizada llamada a crearMuestraWS.")
                        if (result.status !== 200) {
                            log(`Error => ${result}`)
                            newmsg.state = -1;
                            newmsg.response = result
                        } else {
                            log(`Muestra creada. Respuesta => ${result.data[0]}`)
                            newmsg.state = 1;
                            newmsg.minsalSample = result.data[0].id_muestra;
                            newmsg.response = JSON.stringify(result.data[0]);
                        }
                        let query = newmsg.tmUpdateQuery();
                        console.log("UPDATE Query => ", query);
                        await database.simpleExecute(query, [], { autoCommit: true }).then(result => {
                            console.log(result);
                            if (result.rowsAffected > 0) {
                                console.log(`Registro ${newmsg.idmensaje} TM actualizado`);
                            } else {
                                console.log(`Registro ${newmsg.idmensaje} TM NO actualizado`);
                            }
                            log(`Proceso finalizado para msg id:${newmsg.idmensaje}`)
                        })
                    })
                        .catch(err => {
                            log('Ocurrió un error al llamar al WS crearMuestras.')
                            console.log(err);
                        })
                };
                // result.rows.forEach(async msg => {

                // });
            } else {
                log('NO se encontraron muestras a crear.')
            }
        }).catch(err => { console.log("Hubo un error => ", err) });
    }
}

const ckprocess = async () => {
    let flag = true;
    //?      - Traer 10 registros de DB tipo TM
    if (flag) {
        oracledb.fetchAsString = [oracledb.CLOB]
        const query = `SELECT * FROM DEVELOPERS.minsal_integracion WHERE STRTIPOMENSAJE = 'CK' WHERE BYTESTADO = 0`;
        const result = await database.simpleExecute(query);
        flag = result > 0
        if (flag) {
            result.rows.forEach(msg => {
                newmsg = new Message(msg);
                newjson = JSON.parse(xml2string(msg.STRMENSAJE));
                verynewjson = new CK(newjson.recepcionarmuestra)
                newmsg.xmlMSG = verynewjson
                deliverSample(newmsg.xmlMSG).then(result => {
                    newmsg.response = result[i]
                    newmsg.minsalSample = result[i].id_muestra;
                })

                let query = newmsg.ckUpdateQuery();
                let result = database.simpleExecute(query);
                if (result > 0) {
                    console.log(`Registro ${newmsg.idmensaje} CK actualizado`);
                } else {
                    console.log(`Registro ${newmsg.idmensaje} CK NO actualizado`);
                }
            });
        }
    }
}

// app.use('/samples', require('./routes/samples'));
// app.use('/users', require('./routes/users'));

// Start webserver
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
