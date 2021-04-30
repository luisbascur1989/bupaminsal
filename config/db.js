const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');

const connectDB = async () => {

    let connection;

    try {
        // Get a non-pooled connection
        connection = await oracledb.getConnection(dbConfig);

        console.log('Conexión exitosa!');

    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

module.exports.connectDB = connectDB;

function simpleExecute(statement, binds = [], opts = {}) {
    return new Promise(async (resolve, reject) => {
        let conn;

        opts.outFormat = oracledb.OBJECT;
        opts.autoCommit = true;

        try {
            conn = await oracledb.getConnection(dbConfig);

            const result = await conn.execute(statement, binds, opts);
            // console.log("@@@ EXECUTE RESULT => ", result);

            resolve(result);
        } catch (err) {
            console.log("@@@ EXECUTE ERROR => ", err);
            reject(err);
        } finally {
            if (conn) { // conn assignment worked, need to close
                try {
                    await conn.close();
                } catch (err) {
                    console.log(err);
                }
            }
        }
    });
}

module.exports.simpleExecute = simpleExecute;