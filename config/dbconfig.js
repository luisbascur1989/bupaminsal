
module.exports = {
    user: process.env.NODE_ORACLEDB_USER || "minsal_integracion",
    password: process.env.NODE_ORACLEDB_PASSWORD || 'M3ns1l_3nt2gr1c34n_b5p1',
    connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || "192.168.215.35/DNLABTST",
    port: process.env.NODE_ORACLEDB_PORT || 1521,
    externalAuth: process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
};