class RE {
    constructor(obj) {
        this.id_muestra = Number(obj.ID_MUESTRA._text);
        this.resultado = obj.RESULTADO._text;
    }
}
module.exports = { RE }