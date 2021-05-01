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

    tmUpdateQuery = () => {
        return `UPDATE DEVELOPERS.minsal_integracion 
                SET STRRESPUESTA = '${this.response}', 
                    BYTESTADO = ${this.state}, 
                    IDMUESTRAMINSAL = ${this.minsalSample},
                    DTMFECHAHORAPROCESO = sysdate 
                WHERE IDMENSAJE = ${this.idmensaje}`
    }

    ckUpdateQuery() {
        return `UPDATE DEVELOPERS.minsal_integracion 
                SET STRRESPUESTA = '${this.response}', 
                    BYTESTADO = ${this.state}, 
                    IDMUESTRAMINSAL = ${this.minsalSample} ,
                    DTMFECHAHORAPROCESO = sysdate 
                WHERE IDMENSAJE = ${this.idmensaje}`
    }

    reUpdateQuery() {
        return `UPDATE DEVELOPERS.minsal_integracion 
                SET STRRESPUESTA = '${this.response}', 
                    BYTESTADO = ${this.state}, 
                    IDMUESTRAMINSAL = ${this.minsalSample} ,
                    DTMFECHAHORAPROCESO = sysdate 
                WHERE IDMENSAJE = ${this.idmensaje}`
    }

    errUpdateQuery(res) {
        return `UPDATE DEVELOPERS.minsal_integrahcion
                SET STRRESPUESTA = '${this.response}' ,
                    BYTESTADO = ${this.state} ,
                    DTMFECHAHORAPROCESO = sysdate 
                WHERE IDMENSAJE = ${this.idmensaje}`
    }

    getHTML() {
        let estado = "";
        switch (this.state) {
            case -1:
                estado = "ERROR"
                break;
            case 0:
                estado = "READY"
                break;
            case 1:
                estado = "PROCESADO"
            default:
                break;
        }
        return `
        <td>${this.idmensaje}</d>
        <td>${this.dnlabReq}</d>
        <td>${this.dnlabReqID}</d>
        <td>${this.dnlabSampleDate}</d>
        <td>${this.minsalSample}</d>
        <td>${this.msgType}</d>
        <td>${this.sampleCreationDate}</d>
        <td>"${this.xmlMSG}"</d>
        <td>${estado}</d>
        <td>${this.sampleTimestamp}</d>
        <td>${this.response}</d>`
    }
}

module.exports = { Message }