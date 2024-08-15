import _Resources from './resources.json'

const Resources = JSON.parse(JSON.stringify(_Resources))

/**
 * 数据填充（占位符拼接）
 * @param {object|...string} sign - 一组字符串或一个对象
 */
function fillData() {
    if (arguments.length === 0) return this;
    var param = arguments[0], str = this;
    if (typeof (param) === 'object') {
        for (var key in param)
            str = str.replace(new RegExp("\\{" + key + "\\}", "g"), param[key]);
        return str;
    } else {
        for (var i = 0; i < arguments.length; i++)
            str = str.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
        return str;
    }
}

for (let key in Resources) {
    if (typeof Resources[key] === 'string') {
        Resources[key] = new String(Resources[key]);
        Resources[key].fillData = fillData;
    }
}

export default Resources