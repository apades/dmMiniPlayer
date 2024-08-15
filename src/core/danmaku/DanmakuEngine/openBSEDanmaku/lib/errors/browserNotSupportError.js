import Resources from '../lib/resources'

/** 
 * 浏览器不支持所引发的错误
 * @deprecated 浏览器不支持所引发的错误。有关基类的详细信息，请参阅 MDN [Error]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Error} 。
 * @alias openBSE.BrowserNotSupportError
 * @extends Error
 */
class BrowserNotSupportError extends Error {
    /**
     * 创建一个异常对象
     * @param {string} message - 消息
     */
    constructor(message) {
        super(Resources.BROWSER_NOT_SUPPORT_ERROR.fillData({ message: message }));
        this.name = "BrowserNotSupportError";
    }
}
export default BrowserNotSupportError