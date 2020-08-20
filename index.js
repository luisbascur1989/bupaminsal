const database = require('./config/db');
const oracledb = require('oracledb');
const express = require('express');
const xml2string = require('./utils/xml');

// Initialize Webserver
const app = express();

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

app.get('/samples/:type', async (req, res) => {
    oracledb.fetchAsString = [oracledb.CLOB]

    const query = `SELECT * FROM DEVELOPERS.minsal_integracion WHERE STRTIPOMENSAJE = '${req.params.type.toUpperCase()}'`
    const result = await database.simpleExecute(query);

    if (result.rows.length === 0)
        console.error("No results");
    else {
        const clob = result.rows[0];
        console.log("CLOB =>", clob);
    }

    let msgs = new Array();

    result.rows.forEach(msg => {
        console.log(msg);
        msgs.push(JSON.parse(xml2string(msg.STRMENSAJE)))
    });

    res.send(msgs);
})

// app.use('/samples', require('./routes/samples'));
// app.use('/users', require('./routes/users'));

// Start webserver
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
