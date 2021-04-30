
module.exports = {
    user: process.env.NODE_ORACLEDB_USER || "minsal_integracion",
    password: process.env.NODE_ORACLEDB_PASSWORD || 'minsal_integracion',
    connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || "dnlab.bupa.cl/DNLAB",
    port: process.env.NODE_ORACLEDB_PORT || 1521,
    externalAuth: process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
};
