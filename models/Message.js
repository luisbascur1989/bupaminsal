class Message {
    constructor(row) {
        this.idmensaje = row.IDMENSAJE;
        this.dnlabReq = row.BYTIDLAB;
        this.dnlabReqID = row.STRIDRICHIESTA;
        this.dnlabSampleDate = row.DTMDATAACCETTAZIONE;
        this.minsalSample = 0;
        this.msgType = row.STRTIPOMENSAJE;
        this.sampleCreationDate = row.DTMFECHAHORACREACION;
        this.xmlMSG = row.STRMENSAJE;
        this.state = row.BYTESTADO;
        this.sampleTimestamp = row.DTMFECHAHORAPROCESO;
        this.response = "";
    }

    // get updateQuery(res) {
    //     return this.makeUpdateQuery(res);
    // }

    tmUpdateQuery = () => {
        return `UPDATE DEVELOPERS.minsal_integracion SET STRRESPUESTA = '${this.response}', BYTESTADO = ${this.state}, IDMUESTRAMINSAL = ${this.minsalSample}
 WHERE IDMENSAJE = ${this.idmensaje}`
    }

    tmckUpdateQuery() {
        return `UPDATE DEVELOPERS.minsal_integracion SET IDMUESTRAMINSAL = ${this.minsalSample} WHERE STRIDRICHIESTA = '${this.dnlabReqID}'`
    }

    ckUpdateQuery() {
        return `UPDATE DEVELOPERS.minsal_integracion SET STRRESPUESTA = '${this.response}', BYTESTADO = ${this.state}, IDMUESTRAMINSAL = ${this.minsalSample} WHERE IDMENSAJE = ${this.idmensaje}`
    }

    // reUpdateQuery(res) {
    //     return `UPDATE DEVELOPERS.minsal_integracion
    //             SET STRRESPUESTA = '${this.response}' ,
    //                 BYTESTADO = ${this.state} 
    //             WHERE IDMENSAJE = ${this.idmensaje}`
    // }

    errUpdateQuery(res) {
        return `UPDATE DEVELOPERS.minsal_integrahcion
                SET STRRESPUESTA = '${this.response}' ,
                    BYTESTADO = ${this.state} 
                WHERE IDMENSAJE = ${this.idmensaje}`
    }
}

module.exports = { Message }