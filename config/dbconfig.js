
module.exports = {
    user: process.env.NODE_ORACLEDB_USER || "developers",
    password: process.env.NODE_ORACLEDB_PASSWORD || 'wlteam',
    connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || "192.168.215.35/DNLABTST",
    port: process.env.NODE_ORACLEDB_PORT || 1521,
    externalAuth: process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
};