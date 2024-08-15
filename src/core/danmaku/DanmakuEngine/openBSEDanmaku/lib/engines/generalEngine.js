import LinkedList from '../lib/linked-list-js'
import Event from '../lib/event'
import RenderersFactory from '../renderers/renderersFactory'
import GeneralType from './generalType'
import Helper from '../lib/helper'
import Resources from '../lib/resources'
import { requestAnimationFrame, cancelAnimationFrame, performance_now } from '../lib/requestAnimationFrame'

/** 
 * 弹幕引擎对象类 
 * @alias openBSE.GeneralEngine
 * @property {openBSE~generalOptions} options - 设置或获取全局选项。
 * @property {bool} visibility - 获取或设置弹幕可见性。
 * @property {string} renderMode - 获取渲染模式。取值为“canvas”、“css3”、“webgl”或“svg”。
 * @property {bool} playState - 获取播放状态。true：正在播放；false：已暂停/停止播放。
 * @property {openBSE~DebugInfo} debugInfo - 获取调试信息。
 * @throws {openBSE.BrowserNotSupportError} 浏览器不支持特定渲染模式时引发错误。
 * @throws {TypeError} 传入的参数错误时引发错误。请参阅 MDN [TypeError]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypeError} 。
 */
class GeneralEngine {
    /**
     * 创建一个弹幕引擎对象。
     * @param {Element} element - 要加载弹幕的元素：有关 Element 接口的信息请参阅MDN [Element]{@link https://developer.mozilla.org/zh-CN/docs/Web/API/Element} 。
     * @param {openBSE~generalOptions} [options] - 全局选项：一个 {@link openBSE~generalOptions} 结构。
     * @param {string} [renderMode="canvas"] - 渲染模式：默认为“canvas”, “可选css3”， “webgl”和“svg”。一般建议使用“canvas”（特别是 FireFox 浏览器 CSS3 渲染效率较低）。在一些版本较老的浏览器中“window.devicePixelRatio”变量不被支持或支持不完整，这会导致在高DPI和页面被缩放的情况下“canvas”和“webgl”渲染模式弹幕显示不正常的情况（弹幕模糊），此时建议使用“css3”渲染模式。
     */
    constructor(element, options, renderMode = 'css3') {
        //变量初始化
        /**
         * 开始时间
         * @private @type {number}
         */
        let _startTime;
        /**
         * 暂停时间
         * @private @type {number}
         */
        let _pauseTime = 0;
        /**
         * 弹幕缓冲区
         * @private @type {LinkedList}
         */
        let _bulletScreenBuffer = new LinkedList();
        /**
         * 实时弹幕列表
         * @private @type {LinkedList}
         */
        let _realTimeBulletScreens = new LinkedList();
        /**
         * 延迟弹幕总数
         * @private @type {number}
         */
        let _delayBulletScreenCount = 0;
        /**
         * 延迟（单位：毫秒）
         * @private @type {number}
         */
        let _delay = 0;
        /**
         * 播放标志
         * @private @type {boolean}
         */
        let _playing;
        /**
         * requestAnimationFrame 句柄
         */
        let _requestAnimationFrameHandel = null;
        /**
         * 刷新频率
         * @private @type {number}
         */
        let _refreshRate = 0.06; //初始刷新频率
        /**
         * 上一次刷新时间
         * @private @type {number}
         */
        let _lastRefreshTime;
        /**
         * 全局选项
         * @private @type {openBSE~generalOptions}
         */
        let _options;
        /**
         * 默认全局变量
         * @private @readonly
         */
        const _defaultOptions = {
            /** 垂直间距 */
            verticalInterval: 8,
            /** 播放速度(倍数) */
            playSpeed: 1,
            /** 时间基准 */
            clock: time => performance_now() - _startTime,
            /** 缩放比例 */
            scaling: 1,
            /** 超时丢弃 */
            timeOutDiscard: true,
            /** 要隐藏的弹幕类型 */
            hiddenTypes: 0,
            /** 弹幕不透明度 */
            opacity: 1,
            /** 鼠标经过样式 */
            cursorOnMouseOver: 'pointer',
            /** 默认弹幕样式 */
            defaultStyle: {
                /** 阴影的模糊级别，0为不显示阴影 */
                shadowBlur: 2,
                /** 字体粗细 */
                fontWeight: '600',
                /** 字体系列 */
                fontFamily: 'sans-serif',
                /** 字体大小（单位：像素） */
                size: 25,
                /** 外框颜色 */
                boxColor: null,
                /** 字体颜色 */
                color: 'white',
                /** 描边颜色 */
                borderColor: null,
                /** 弹幕速度（单位：像素/毫秒） 仅流弹幕类型有效 */
                speed: 0.15,
                /** 弹幕停留时间 仅固定弹幕类型有效 */
                residenceTime: 5000
            }
        }

        /**
         * 全局选项类型
         * @private @readonly
         */
        const _optionsType = {
            verticalInterval: 'number',
            playSpeed: 'number',
            clock: 'function',
            scaling: 'number',
            timeOutDiscard: 'boolean',
            hiddenTypes: 'number',
            opacity: 'number',
            cursorOnMouseOver: 'string',
            defaultStyle: {
                shadowBlur: 'number',
                fontWeight: ['string', 'number'],
                fontFamily: 'string',
                size: 'number',
                boxColor: ['string', 'null'],
                color: 'string',
                borderColor: ['string', 'null'],
                speed: 'number',
                residenceTime: 'number'
            }
        }

        /**
         * 默认弹幕数据
         * @private @readonly
         */
        const _defaultBulletScreen = {
            /** 弹幕文本 */
            text: null,
            /** 是否允许丢弃 */
            canDiscard: true,
            /** 弹幕进入时间 */
            startTime: null,
            /** 弹幕类型 */
            type: GeneralType.rightToLeft,
            /** 弹幕层级（越大越前） */
            layer: 0
        }

        /**
         * 弹幕数据类型
         * @private @readonly
         */
        const _bulletScreenType = {
            text: 'string',
            canDiscard: 'boolean',
            startTime: 'number',
            type: 'number',
            layer: 'number'
        }

        _options = Helper.setValues(options, _defaultOptions, _optionsType); //设置默认值

        //事件初始化
        let _event = new Event();
        /**
         * 弹幕单击事件。当单击弹幕时触发。
         * @event openBSE.GeneralEngine#click
         * @property {openBSE~GeneralEvent} e - 弹幕事件结构
         */
        _event.add('click');
        /**
         * 弹幕上下文菜单事件。当触发弹幕上下文菜单时触发。
         * @event openBSE.GeneralEngine#contextmenu
         * @property {openBSE~GeneralBulletScreenEvent} e - 弹幕事件结构
         */
        _event.add('contextmenu');
        /**
        * 弹幕鼠标离开事件。当鼠标离开弹幕时触发。
        * @event openBSE.GeneralEngine#mouseleave
        * @property {openBSE~GeneralBulletScreenEvent} e - 弹幕事件结构
        */
        _event.add('mouseleave');
        /**
         * 弹幕鼠标进入事件。当鼠标进入弹幕时触发。
         * @event openBSE.GeneralEngine#mouseenter
         * @property {openBSE~GeneralBulletScreenEvent} e - 弹幕事件结构
         */
        _event.add('mouseenter');
        /**
         * 绑定事件处理程序
         * @function
         * @description 绑定事件处理程序。当事件处理程序返回值为 false 时停止冒泡。
         * @param {string} name - 事件名称
         * @param {function} fun - 事件处理程序
         * @listens openBSE.GeneralEngine#click
         * @listens openBSE.GeneralEngine#contextmenu
         * @listens openBSE.GeneralEngine#mouseleave
         * @listens openBSE.GeneralEngine#mouseenter
         * @throws {TypeError} 传入的参数错误或事件不存在时引发错误。请参阅 MDN [TypeError]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypeError} 。
         */
        this.bind = _event.bind;
        /**
         * 解绑事件处理程序（fun为空解绑所有事件处理程序）
         * @function
         * @param {string} name - 事件名称
         * @param {function} fun - 事件处理程序
         * @throws {TypeError} 传入的参数错误或事件不存在时引发错误。请参阅 MDN [TypeError]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypeError} 。
         */
        this.unbind = _event.unbind;
        //初始化
        let _elementSize = {
            width: element.clientWidth / _options.scaling,
            height: element.clientHeight / _options.scaling
        }
        let _oldDevicePixelRatio = Helper.getDevicePixelRatio();
        let _oldScaling = _options.scaling;
        let _oldClientWidth = element.clientWidth;
        let _oldClientHeight = element.clientHeight;
        let _oldHiddenTypes = _options.hiddenTypes;
        let _oldOpacity = _options.opacity;
        //渲染器工厂
        let renderersFactory = new RenderersFactory(element, _options, _elementSize, bulletScreenEventTrigger);
        let _renderer = renderersFactory.getGeneralRenderer(renderMode); //实例化渲染器
        console.log('_renderer',_renderer)
        setInterval(setSize, 100);

        //公共函数
        /**
         * 设置或获取全局选项
         * @private
         **/
        Object.defineProperty(this, 'options', {
            get: function () {
                return Helper.clone(_options);
            },
            set: function (options) {
                _options = Helper.setValues(options, _options, _optionsType, false); //设置默认值
                if (_oldHiddenTypes != _options.hiddenTypes) {
                    _oldHiddenTypes = _options.hiddenTypes;
                    if (!_playing) _renderer.draw(); //非播放状态则重绘
                }
                if (_oldOpacity != _options.opacity) {
                    _oldOpacity = _options.opacity;
                    _renderer.setOpacity();
                }
            }
        });

        /**
         * 添加弹幕到弹幕列表。
         * @description 添加弹幕到弹幕列表。由于弹幕在屏幕上出现过后，弹幕引擎将从列表中彻底删除此弹幕。所以，在改变播放进度时，可能需要先[清空弹幕列表]{@link openBSE.BulletScreenEngine#cleanBulletScreenList}，然后重新加载此播放进度以后的弹幕。
         * @param {openBSE~GeneralBulletScreen} bulletScreen - 单条弹幕数据：一个 {@link openBSE~GeneralBulletScreen} 结构。
         * @throws {TypeError} 传入的参数错误时引发错误。请参阅 MDN [TypeError]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypeError} 。
         */
        this.add = function (bulletScreen) {
            _defaultBulletScreen.startTime = _options.clock();
            bulletScreen = Helper.setValues(bulletScreen, _defaultBulletScreen, _bulletScreenType); //设置默认值

            if (
                bulletScreen.type != GeneralType.leftToRight &&
                bulletScreen.type != GeneralType.rightToLeft &&
                bulletScreen.type != GeneralType.top &&
                bulletScreen.type != GeneralType.bottom
            ) throw new TypeError(Resources.PARAMETERS_TYPE_ERROR);

            Helper.checkTypes(bulletScreen.style, _optionsType.defaultStyle); //检查弹幕样式类型

            let newNode = new LinkedList.node(bulletScreen);
            _bulletScreenBuffer.forEach(function (node) {
                let lastBulletScreen = node.element;
                if (bulletScreen.startTime > lastBulletScreen.startTime) return {
                    add: { addToUp: true, node: newNode },
                    stop: true
                };
            }, true);
            if (newNode.linkedList === null) _bulletScreenBuffer.push(newNode, false);

        };

        /**
         * 开始播放弹幕。
         */
        this.play = function () {
            if (!_playing) {
                if (!_startTime)
                    _startTime = performance_now();
                if (_pauseTime)
                    _startTime += _options.clock() - _pauseTime;
                _lastRefreshTime = null;
                _playing = true;
                _requestAnimationFrameHandel = requestAnimationFrame(refresh);
            }
        };

        /**
         * 继续所有在事件响应中设置了 e.pause = true; 弹幕的播放。
         */
        this.playAllBulletScreens = () =>
            _realTimeBulletScreens.forEach((node) => node.element.pause = false);

        /**
         * 暂停播放弹幕。
         * @description 暂停播放弹幕。暂停播放弹幕是指弹幕播放暂停，所有未出现的弹幕将停止出现，已出现的弹幕停止运动，停止消失。
         */
        this.pause = function () {
            if (_playing) {
                _pauseTime = _options.clock();
                _playing = false;
                cancelAnimationFrame(_requestAnimationFrameHandel);
            }
        };

        /**
         * 清空弹幕缓冲区。
         * @description 清空弹幕列表，但屏幕上已经出现的弹幕不会被清除。
         */
        this.cleanBuffer = function () {
            _bulletScreenBuffer.clean();
        };

        /**
         * 清空屏幕内容。
         * @description 清空屏幕内容。清空屏幕上已经出现的弹幕，不包括弹幕列表中的弹幕。
         */
        this.cleanScreen = function () {
            _realTimeBulletScreens.clean();
            _renderer.cleanScreen();
        };

        /**
         * 停止播放弹幕。
         * @description 停止播放弹幕。停止播放弹幕是指停止播放弹幕，默认[时间基准（options.clock）]{@link openBSE~BulletScreenStyle}归零，并[清空弹幕列表]{@link openBSE.BulletScreenEngine#cleanBulletScreenList}、[清空屏幕内容]{@link openBSE.BulletScreenEngine#cleanScreen}。
         */
        this.stop = function () {
            if (_playing) {
                this.pause();
            }
            this.cleanBuffer();
            this.cleanScreen();
            _pauseTime = 0;
            _startTime = null;
        };

        /**
         * 获取或设置弹幕可见性。
         * @private
         */
        Object.defineProperty(this, 'visibility', {
            get: function () {
                return _renderer.getVisibility();
            },
            set: function (visibility) {
                if (visibility) _renderer.show();
                else _renderer.hide();
            }
        });

        /**
         * 获取渲染模式。
         * @private
         */
        Object.defineProperty(this, 'renderMode', {
            get: function () {
                return renderMode;
            }
        });

        /**
         * 获取播放状态。
         * @private
         */
        Object.defineProperty(this, 'playState', {
            get: function () {
                return _playing;
            }
        });

        /**
        * 获取调试信息。
        * @private
        */
        Object.defineProperty(this, 'debugInfo', {
            get: function () {
                return {
                    time: _playing ? _options.clock() : _pauseTime,
                    realTimeBulletScreenCount: _realTimeBulletScreens.length,
                    bufferBulletScreenCount: _bulletScreenBuffer.length,
                    delay: _delay,
                    delayBulletScreenCount: _delayBulletScreenCount,
                    fps: _playing ? _refreshRate * 1000 : 0 //帧频
                };
            }
        });

        //内部函数
        /**
         * 弹幕事件响应
         * @param {string} name - 事件名称
         * @param {object} realTimeBulletScreen - 实时弹幕对象
         * @param {object} e - 事件信息
         */
        function bulletScreenEventTrigger(name, realTimeBulletScreen, e) {
            if (typeof e.pageX === 'undefined' || e.pageX === null) {
                let doc = document.documentElement, body = document.body;
                e.pageX = e.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                e.pageY = e.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
            }
            _event.trigger(name, {
                /**
                 * 获取引发事件的弹幕弹幕的数据
                 * @private
                 * @returns {openBSE~GeneralBulletScreen} 引发事件的弹幕的数据：一个 {@link openBSE~GeneralBulletScreen} 结构。（注意：不要试图与[添加弹幕]{@link openBSE.GeneralEngine#addBulletScreen}时创建的对象进行比较，这个对象是克隆得到的，并不相等。正确的方法是在添加弹幕时一并插入 id 等自定义字段来唯一标识一条弹幕。）
                 */
                getBulletScreen: () => Helper.clone(realTimeBulletScreen.bulletScreen),
                /**
                 * 设置引发事件的弹幕弹幕的数据
                 * @private
                 * @param {openBSE~GeneralBulletScreen} bulletScreen - 引发事件的弹幕的数据：一个 {@link openBSE~GeneralBulletScreen} 结构。设置此参数以便动态调整弹幕样式，但是一些参数在事件中修改无效，查看此结构的说明以了解详情。
                 * @param {boolean} [redraw=false] - 是否重绘弹幕：此参数在每次引发事件时的初始值为 false ，如果修改了 bulletScreen 中的值，此参数必须设为 true 。
                 */
                setBulletScreen: (bulletScreen, redraw = false) => {
                    if (typeof redraw != 'boolean') throw new TypeError(Resources.PARAMETERS_TYPE_ERROR);
                    let bulletScreenType = Helper.clone(_bulletScreenType);
                    bulletScreenType.style = _optionsType.defaultStyle;
                    realTimeBulletScreen.bulletScreen = Helper.setValues(bulletScreen, realTimeBulletScreen.bulletScreen, bulletScreenType); //设置值
                    if (redraw === true) _renderer.reCreatAndgetWidth(realTimeBulletScreen); //重新创建并绘制弹幕
                    if (!_playing && redraw) _renderer.draw(); //非播放状态则重绘
                },
                /**
                 * 获取引发事件的弹幕的播放状态
                 * @private
                 * @returns {boolean} 取引发事件的弹幕是否在播放/移动：如果设置为 true 则该弹幕暂停，直到将此参数设为 false 或调用 {@link openBSE.GeneralEngine#playAllBulletScreens} 方法。
                 */
                getPlayState: () => !realTimeBulletScreen.pause,
                /**
                 * 设置引发事件的弹幕的播放状态
                 * @private
                 * @param {boolean} paly - 是否继续播放/移动引发事件的弹幕：读取此参数可判断这条弹幕是否处于暂停状态。
                 */
                setPlayState: (play) => {
                    if (typeof play != 'boolean') throw new TypeError(Resources.PARAMETERS_TYPE_ERROR);
                    realTimeBulletScreen.pause = !play;
                },
                screenX: e.screenX, screenY: e.screenY,
                pageX: e.pageX, pageY: e.pageY,
                clientX: e.clientX, clientY: e.clientY
            });
        }

        /**
         * 刷新弹幕函数
         * @private
         */
        function refresh(timestamp) {
            let nowTime = timestamp;
            if (_lastRefreshTime != null)
                _refreshRate = 1 / (nowTime - _lastRefreshTime);
            _lastRefreshTime = nowTime;
            addRealTimeBulletScreens();
            moveRealTimeBulletScreen();
            if (_renderer.getVisibility()) _renderer.draw(); //绘制弹幕(隐藏状态不绘制)
            if (_playing)
                _requestAnimationFrameHandel = requestAnimationFrame(refresh);
        }

        /**
         * 移动弹幕函数
         * @private
         */
        function moveRealTimeBulletScreen() {
            _realTimeBulletScreens.forEach((node) => {
                let realTimeBulletScreen = node.element;
                if (realTimeBulletScreen.pause) return; //暂停移动
                let nowTime = _options.clock();
                switch (realTimeBulletScreen.type) {
                    case GeneralType.rightToLeft:
                        if (realTimeBulletScreen.x > -realTimeBulletScreen.width) {
                            realTimeBulletScreen.x -= realTimeBulletScreen.bulletScreen.style.speed * _options.playSpeed / _refreshRate;
                        }
                        else {
                            _renderer.delete(realTimeBulletScreen);
                            return { remove: true };
                        }
                        break;
                    case GeneralType.leftToRight:
                        if (realTimeBulletScreen.x < _elementSize.width) {
                            realTimeBulletScreen.x += realTimeBulletScreen.bulletScreen.style.speed * _options.playSpeed / _refreshRate;
                        }
                        else {
                            _renderer.delete(realTimeBulletScreen);
                            return { remove: true };
                        }
                        break;
                    case GeneralType.top:
                    case GeneralType.bottom:
                        if (realTimeBulletScreen.endTime < nowTime) {
                            _renderer.delete(realTimeBulletScreen);
                            return { remove: true };
                        }
                        break;
                }
            }, true);
        }

        /**
         * 添加弹幕到实时弹幕列表
         * @private
         */
        function addRealTimeBulletScreens() {
            if (_realTimeBulletScreens.length === 0)
                _delay = 0;
            let times = Math.floor(_refreshRate * 2000);
            do {
                let node = _bulletScreenBuffer.pop(false, false);
                if (node === null) return;
                let bulletScreen = node.element;
                let nowTime = _options.clock();
                if (bulletScreen.startTime > nowTime) return;
                if (!_options.timeOutDiscard || !bulletScreen.canDiscard || bulletScreen.startTime > nowTime - Math.floor(1 / _refreshRate) * 60) {
                    bulletScreen.style = Helper.setValues(bulletScreen.style, _options.defaultStyle, _optionsType.defaultStyle); //填充默认样式
                    getRealTimeBulletScreen(nowTime, bulletScreen); //生成实时弹幕对象并添加到实时弹幕集合            
                }
                else _delayBulletScreenCount++;
                node.remove();
                times--;
            } while (_realTimeBulletScreens.length === 0 || times > 0);
        }

        /**
         * 生成实时弹幕对象
         * @private
         * @param {number} nowTime - 当前时间
         * @param {openBSE~BulletScreen} bulletScreen - 弹幕的链表节点
         */
        function getRealTimeBulletScreen(nowTime, bulletScreen) {
            _delay = nowTime - bulletScreen.startTime;
            let realTimeBulletScreen = {};
            realTimeBulletScreen.pause = false; //是否暂停移动
            realTimeBulletScreen.bulletScreen = bulletScreen;
            realTimeBulletScreen.startTime = nowTime; //弹幕头部进屏幕时间
            realTimeBulletScreen.size = bulletScreen.style.size; //字体大小：像素
            realTimeBulletScreen.type = bulletScreen.type; //弹幕类型
            realTimeBulletScreen.height = realTimeBulletScreen.size; //弹幕的高度：像素
            _renderer.creatAndgetWidth(realTimeBulletScreen); //创建弹幕元素并计算宽度
            switch (bulletScreen.type) {
                case GeneralType.rightToLeft:
                    realTimeBulletScreen.endTime = Math.round(nowTime + (_elementSize.width + realTimeBulletScreen.width) / (bulletScreen.style.speed * _options.playSpeed)); //弹幕尾部出屏幕的时间
                    realTimeBulletScreen.x = _elementSize.width; //弹幕初始X坐标
                    realTimeBulletScreen.y = _options.verticalInterval; //弹幕初始Y坐标
                    break;
                case GeneralType.leftToRight:
                    realTimeBulletScreen.endTime = Math.round(nowTime + (_elementSize.width + realTimeBulletScreen.width) / (bulletScreen.style.speed * _options.playSpeed)); //弹幕尾部出屏幕的时间
                    realTimeBulletScreen.x = -realTimeBulletScreen.width; //弹幕初始X坐标
                    realTimeBulletScreen.y = _options.verticalInterval; //弹幕初始Y坐标
                    break;
                case GeneralType.top:
                    realTimeBulletScreen.endTime = realTimeBulletScreen.startTime + bulletScreen.style.residenceTime * _options.playSpeed;
                    realTimeBulletScreen.x = Math.round((_elementSize.width - realTimeBulletScreen.width) / 2); //弹幕初始X坐标
                    realTimeBulletScreen.y = _options.verticalInterval; //弹幕初始Y坐标
                    break;
                case GeneralType.bottom:
                    realTimeBulletScreen.endTime = realTimeBulletScreen.startTime + bulletScreen.style.residenceTime * _options.playSpeed;
                    realTimeBulletScreen.x = Math.round((_elementSize.width - realTimeBulletScreen.width) / 2); //弹幕初始X坐标
                    realTimeBulletScreen.y = -_options.verticalInterval - realTimeBulletScreen.height; //弹幕初始Y坐标
                    break;
            }

            let newNode = new LinkedList.node(realTimeBulletScreen);
            if (bulletScreen.type === GeneralType.top || bulletScreen.type === GeneralType.bottom) {
                _realTimeBulletScreens.forEach((node) => {
                    let nextrealTimeBulletScreen = node.element;
                    //弹幕不在流中，是固定弹幕
                    if (nextrealTimeBulletScreen.bulletScreen.type != bulletScreen.type)
                        return; //不是同一种类型的弹幕
                    if (bulletScreen.type === GeneralType.top) {
                        //如果新弹幕在当前弹幕上方且未与当前弹幕重叠
                        if (realTimeBulletScreen.y + realTimeBulletScreen.height < nextrealTimeBulletScreen.y) {
                            setActualY(realTimeBulletScreen);
                            return { add: { addToUp: true, node: newNode }, stop: true };
                        }
                        //如果上一条弹幕的消失时间小于当前弹幕的出现时间
                        if (nextrealTimeBulletScreen.endTime < nowTime)
                            realTimeBulletScreen.y = nextrealTimeBulletScreen.y;
                        else
                            realTimeBulletScreen.y = nextrealTimeBulletScreen.y + nextrealTimeBulletScreen.height + _options.verticalInterval;
                    }
                    else {
                        //如果新弹幕在当前弹幕下方且未与当前弹幕重叠
                        if (realTimeBulletScreen.y > nextrealTimeBulletScreen.y + nextrealTimeBulletScreen.height) {
                            setActualY(realTimeBulletScreen);
                            return { add: { addToUp: true, node: newNode }, stop: true };
                        }
                        //如果上一条弹幕的消失时间小于当前弹幕的出现时间
                        if (nextrealTimeBulletScreen.endTime < nowTime)
                            realTimeBulletScreen.y = nextrealTimeBulletScreen.y;
                        else
                            realTimeBulletScreen.y = nextrealTimeBulletScreen.y - realTimeBulletScreen.height - _options.verticalInterval;
                    }
                }, true);
            }
            else {
                //当前弹幕经过一个点需要的总时长
                let realTimeBulletScreenWidthTime = realTimeBulletScreen.width / (bulletScreen.style.speed * _options.playSpeed);
                _realTimeBulletScreens.forEach((node) => {
                    let nextrealTimeBulletScreen = node.element;
                    //弹幕在流中，是移动弹幕
                    if (nextrealTimeBulletScreen.bulletScreen.type === GeneralType.top || nextrealTimeBulletScreen.bulletScreen.type === GeneralType.bottom)
                        return; //弹幕不在流中，为固定弹幕
                    //如果新弹幕在当前弹幕上方且未与当前弹幕重叠
                    if (realTimeBulletScreen.y + realTimeBulletScreen.height < nextrealTimeBulletScreen.y) {
                        setActualY(realTimeBulletScreen);
                        return { add: { addToUp: true, node: newNode }, stop: true };
                    }
                    //上一条弹幕经过一个点需要的总时长
                    let nextrealTimeBulletScreenWidthTime = nextrealTimeBulletScreen.width / (nextrealTimeBulletScreen.bulletScreen.style.speed * _options.playSpeed);
                    //如果上一条弹幕的消失时间小于当前弹幕的出现时间
                    if (nextrealTimeBulletScreen.startTime + nextrealTimeBulletScreenWidthTime >= nowTime || //如果上一条弹幕的头进入了，但是尾还没进入
                        nextrealTimeBulletScreen.endTime >= realTimeBulletScreen.endTime - realTimeBulletScreenWidthTime) //如果当前弹幕头出去了，上一条弹幕尾还没出去
                        realTimeBulletScreen.y = nextrealTimeBulletScreen.y + nextrealTimeBulletScreen.height + _options.verticalInterval;
                    else
                        realTimeBulletScreen.y = nextrealTimeBulletScreen.y;
                }, true);
            }
            if (newNode.linkedList === null) {
                setActualY(realTimeBulletScreen);
                _realTimeBulletScreens.push(newNode, false);
            }
        }

        /**
         * 设置真实的Y坐标
         * @private
         * @param {object} realTimeBulletScreen - 实时弹幕事件
         * @returns {object} 实时弹幕事件
         */
        function setActualY(realTimeBulletScreen) {
            let bulletScreen = realTimeBulletScreen.bulletScreen;
            if (
                bulletScreen.type === GeneralType.leftToRight ||
                bulletScreen.type === GeneralType.rightToLeft ||
                bulletScreen.type === GeneralType.top
            ) {
                realTimeBulletScreen.actualY = realTimeBulletScreen.y % (_elementSize.height - realTimeBulletScreen.height);
            }
            else if (bulletScreen.type === GeneralType.bottom) {
                realTimeBulletScreen.actualY = _elementSize.height + realTimeBulletScreen.y % _elementSize.height;
            }
        }

        /**
         * 设置尺寸
         * @private
         */
        function setSize() {
            let devicePixelRatio = Helper.getDevicePixelRatio();
            if (_oldDevicePixelRatio != devicePixelRatio ||
                _oldClientWidth != element.clientWidth ||
                _oldClientHeight != element.clientHeight ||
                _oldScaling != _options.scaling) {
                _oldScaling = _options.scaling;
                _elementSize.width = element.clientWidth / _options.scaling;
                _elementSize.height = element.clientHeight / _options.scaling;
                _oldClientWidth = element.clientWidth;
                _oldClientHeight = element.clientHeight;
                _oldDevicePixelRatio = devicePixelRatio;
                _renderer.setSize();
                if (!_playing) _renderer.draw(); //非播放状态则重绘
            }
        }
    }
}

export default GeneralEngine