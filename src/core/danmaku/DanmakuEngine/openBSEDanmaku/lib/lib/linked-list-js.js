/**
 * 双向链表类
 */
class LinkedList {
    /**
     * 创建一个双向链表。
     */
    constructor() {
        //初始化
        this._topNode = new LinkedList.node(null);
        this._bottomNode = new LinkedList.node(null);
        this._length = 0;
        this._topNode._next = this._bottomNode;
        this._bottomNode._previous = this._topNode;
        this._topNode._linkedList = this._bottomNode._linkedList = this;
    }
    //公共函数
    /**
     * 获取元素个数
     * @returns {number} 元素个数
     */
    get length() {
        return this._length;
    }
    /**
     * 插入节点
     * @param {*} node - 节点
     * @param {boolean} top - true: 插入到顶部 false: 插入到底部
     */
    push(node, top = true) {
        if (top) return this._topNode.add(node, false);
        else return this._bottomNode.add(node, true);
    }
    /**
     * 读取元素
     * @param {boolean} remove - 读取后是否删除
     * @param {boolean} top - true: 读取顶部 false: 读取底部
     * @returns {*} 节点
     */
    pop(remove = true, top = true) {
        let thisNode;
        if (top) thisNode = this._topNode.next;
        else thisNode = this._bottomNode.previous;
        if (thisNode != null && remove) thisNode.remove();
        return thisNode;
    }
    /**
     * 清空链表
     */
    clean() {
        this._topNode._next = this._bottomNode;
        this._bottomNode._previous = this._topNode;
        this._length = 0;
    }
    /**
     * 遍历链表
     * @param {function} fun - 遍历回调函数
     * 回调函数（参数：元素，返回：{remove：删除此元素，add:插入节点(add.addToUp:插入到上方, add.node:节点), stop：停止遍历}）
     * @param {boolean} topToBottom - true: 从顶到底 false: 从底到顶
     */
    forEach(fun, topToBottom) {
        let thisNode = topToBottom ? this._topNode : this._bottomNode;
        let nextNode = topToBottom ? thisNode._next : thisNode._previous;
        while (topToBottom ? (thisNode = nextNode) != this._bottomNode : (thisNode = nextNode) != this._topNode) {
            nextNode = topToBottom ? thisNode._next : thisNode._previous;
            let _return = fun(thisNode);
            if (_return) {
                if (_return.add) thisNode.add(_return.add.node, _return.add.addToUp);
                if (_return.remove) thisNode.remove();
                if (_return.stop) return;
            }
        }
    };
    /**
     * 双向链表节点
     * @private
    */
    static get node() {
        return class {
            /**
             * 创建一个双向链表节点。
             * @param {*} element - 元素
             */
            constructor(element) {
                this._element = element;
                this._next = null;
                this._previous = null;
                this._linkedList = null;
            }
            /**
             * 获取元素。
             */
            get element() {
                return this._element;
            }
            /**
             * 获取双向链表。
             */
            get linkedList() {
                return this._linkedList;
            }
            /**
             * 获取上一个双向链表节点。
             */
            get previous() {
                if (this._linkedList === null || this._previous === this._linkedList._topNode) return null;
                else return this._previous;
            }
            /**
             * 获取下一个双向链表节点。
             */
            get next() {
                if (this._linkedList === null || this._next === this._linkedList._bottomNode) return null;
                else return this._next;
            }
            /**
             * 添加双向链表节点。
             * @param {*} node - 节点
             * @param {*} addToUp - 插入到上方
             */
            add(node, addToUp = true) {
                node.remove();
                if (addToUp) {
                    node._previous = this._previous;
                    node._next = this;
                    this._previous._next = node;
                    this._previous = node;
                } else {
                    node._previous = this;
                    node._next = this._next;
                    this._next._previous = node;
                    this._next = node;
                }
                node._linkedList = this._linkedList;
                this._linkedList._length++;
                return true;
            }
            remove() {
                if (this._next == null || this._previous == null ||
                    this._linkedList == null) return false;
                this._previous._next = this._next;
                this._next._previous = this._previous;
                this._next = this._previous = null;
                this._linkedList._length--;
                this._linkedList = null;
                return true;
            }
        }
    }
}

export default LinkedList