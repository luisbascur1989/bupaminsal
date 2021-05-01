class TM {
    constructor(obj) {
        this.codigo_muestra_cliente = obj.codigo_muestra_cliente._text;
        this.id_laboratorio = Number(obj.id_laboratorio._text);
        this.rut_responsable = obj.rut_responsable._text;
        this.cod_deis = Number(obj.cod_deis._text);
        this.rut_medico = obj.rut_medico._text;
        this.paciente_run = Number(obj.paciente_run._text);
        this.paciente_dv = obj.paciente_dv._text;
        this.paciente_pasaporte = obj.paciente_pasaporte._text;
        this.paciente_ext_paisorigen = obj.paciente_ext_paisorigen._text;
        this.paciente_nombres = obj.paciente_nombres._text;
        this.paciente_ap_pat = obj.paciente_ap_pat._text;
        this.paciente_ap_mat = obj.paciente_ap_mat._text;
        this.paciente_fecha_nac = obj.paciente_fecha_nac._text;
        this.paciente_comuna = Number(obj.paciente_comuna._text);
        this.paciente_direccion = obj.paciente_direccion._text;
        this.paciente_telefono = obj.paciente_telefono._text;
        this.paciente_tipodoc = obj.paciente_tipodoc._text;
        this.paciente_sexo = obj.paciente_sexo._text;
        this.paciente_prevision = obj.paciente_prevision._text;
        this.fecha_muestra = obj.fecha_muestra._text;
        this.tecnica_muestra = obj.tecnica_muestra._text;
        this.tipo_muestra = obj.tipo_muestra._text;
    }
}
module.exports = { TM }