class Message {
    constructor(idmensaje, dnlabReq, dnlabReqDate, dnlabSample, minsalSample, msgType, sampleCreationDate, xmlMSG, state, sampleTimestamp, response) {
        this.idmensaje = idmensaje;
        this.dnlabReq = dnlabReq;
        this.dnlabReqDate = dnlabReqDate;
        this.dnlabSample = dnlabSample;
        this.minsalSample = minsalSample;
        this.msgType = msgType;
        this.sampleCreationDate = sampleCreationDate;
        this.xmlMSG = xmlMSG;
        this.state = state;
        this.sampleTimestamp = sampleTimestamp;
        this.response = response;
    }

    get updateQuery(res) {
        return this.makeUpdateQuery(res);
    }

    makeUpdateQuery(res) {
        return `UPDATE DEVELOPERS.minsal_integrahcion
                SET STRRESPUESTA = ${res.str},
                    BYTESTADO = ${res.estado}
                WHERE IDMENSAJE = ${this.idmensaje}`
    }
}