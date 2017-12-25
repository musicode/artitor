(function (global) {

    var NODE_TYPE_ELEMENT = 1;
    var NODE_TYPE_TEXT = 3;

    var KEY_CODE_ENTER = 13;

    var EMPTY_VALUE = '\u200B';

    var bodyElement = document.body;

    /**
     * 设置全局的选区
     *
     * @param {Range} range
     */
    function setRange(range) {
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     *
     * @param {Object} options
     * @property {HTMLElement} options.element
     * @property {string} options.content
     * @property {string} options.placeholder
     * @property {Function} options.onContentChange
     */
    function Artitor(options) {

        var me = this;
        var element = options.element;

        me.options = options;
        me.element = element;
        me.setContent(options.content);
        if (options.placeholder) {
            me.setPlaceholder(options.placeholder);
        }

        element.addEventListener(
            'keydown',
            me.onKeydown = function (event) {
                var keyCode = event.keyCode;
                if (keyCode === KEY_CODE_ENTER) {
                    event.preventDefault();
                    me.insertNode(
                        document.createTextNode(''),
                        true
                    );
                }
            }
        );

        var pasteReadTimer;
        var pasteReadHolder;

        element.addEventListener(
            'paste',
            me.onPaste = function (event) {

                me.saveSelection();

                if (pasteReadTimer) {
                    clearTimeout(pasteReadTimer);
                    pasteReadTimer = null;
                }

                if (pasteReadHolder) {
                    pasteReadHolder.innerHTML = '';
                }
                else {
                    pasteReadHolder = document.createElement('div');
                    pasteReadHolder.style.cssText = 'position: absolute;top: 0; left: 0;opacity: 0;';
                    pasteReadHolder.contentEditable = true;
                    bodyElement.appendChild(pasteReadHolder);
                }

                var range = document.createRange();
                range.setStart(pasteReadHolder, 0);

                setRange(range);

                var tryCount = 0;
                var maxTryCount = 3;

                var processContent = function () {

                    // 先去掉一些字符串不好操作的元素
                    [
                        'noscript',
                        'script',
                        'object',
                        'style',
                        'video',
                        'audio',
                        'embed',
                        'form',
                    ]
                    .forEach(
                        function (tag) {
                            var nodes = pasteReadHolder.querySelectorAll(tag);
                            for (var i = nodes.length - 1; i >= 0; i--) {
                                nodes[i].parentNode.removeChild(nodes[i]);
                            }
                        }
                    );

                    var content = pasteReadHolder.innerHTML;

                    // 去掉属性，保证接下来处理的是干净的标签
                    content = content.replace(/<(\w+)(\/| [^>]+)>/g, '<$1>');

                    // 只支持 div br
                    content = content.replace(/<(\/?)(\w+)>/g, function ($0, $1, $2) {

                        $2 = $2.toLowerCase();

                        if ($2 === 'div' || $2 === 'br') {
                            return '<' + $1 + $2 + '>';
                        }

                        // 避免 p 的上下边距
                        if ($2 === 'p') {
                            return '<' + $1 + 'div>';
                        }
                        return '';

                    });

                    // 去掉空标签
                    content = content.replace(/<div>\s*<\/div>/g, '<br>');

                    if (content) {
                        var div = document.createElement('div');
                        div.innerHTML = content;
                        me.restoreSelection();
                        me.insertNode(div.childNodes);
                    }

                };

                var readContent = function () {
                    if (pasteReadHolder.textContent) {
                        processContent();
                        bodyElement.removeChild(pasteReadHolder);
                    }
                    else {
                        pasteReadTimer = setTimeout(
                            function () {
                                pasteReadTimer = null;
                                if (tryCount < maxTryCount) {
                                    readContent();
                                    tryCount++;
                                }
                                else {
                                    bodyElement.removeChild(pasteReadHolder);
                                }
                            },
                            50
                        );
                    }
                };

                readContent();

            }
        );

        element.addEventListener(
            'input',
            me.onInput = function () {
                me.onContentChange();
            }
        );

    }

    Artitor.prototype = {

        constructor: Artitor,

        destory: function () {
            this.element.removeEventListener('keydown', this.onKeydown);
            this.element.removeEventListener('paste', this.onPaste);
            this.element.removeEventListener('input', this.onInput);
        },

        /**
         * 获取当前选区
         *
         * {
         *   collapsed: {boolean},
         *   commonAncestorContainer: {HTMLNode},
         *   endContainer: {HTMLNode},
         *   endOffset: {number},
         *   startContainer: {HTMLNode},
         *   startOffset: {number},
         * }
         *
         * @return {?Object}
         */
        getSelection: function () {
            var selection = window.getSelection();
            if (selection.rangeCount) {
                return selection.getRangeAt(0);
            }
        },

        /**
         * 存储当前选区
         */
        saveSelection: function () {
            this.currentSelection = this.getSelection();
        },

        /**
         * 恢复上次存储的选区
         */
        restoreSelection: function () {
            if (this.currentSelection) {
                setRange(this.currentSelection);
            }
        },

        /**
         * 获取焦点
         */
        focus: function () {
            this.element.focus();
            var selection = window.getSelection();
            selection.selectAllChildren(this.element);
            selection.collapseToEnd();
        },

        /**
         * 失去焦点
         */
        blur: function () {
            this.element.blur();
        },

        onContentChange: function () {
            this.element.setAttribute('empty', this.isEmpty() ? '1' : '0');
            var onContentChange = this.options.onContentChange;
            if (onContentChange) {
                onContentChange();
            }
        },

        isEmpty: function () {
            var content = this.getContent();
            return content === '' || content === '<br>';
        },

        getContent: function () {
            var content = this.element.innerHTML;
            if (content) {
                content = content.replace(
                    / style="[^"]+"/g,
                    ''
                );
            }
            return content;
        },

        setContent: function (content) {
            var element = this.element
            if (!content) {
                content = '<br>';
            }
            element.innerHTML = content;
            element.setAttribute('empty', this.isEmpty() ? '1' : '0');
        },

        getPlaceholder: function () {
            return this.element.getAttribute('placeholder') || '';
        },

        setPlaceholder: function (placeholder) {
            this.element.setAttribute('placeholder', placeholder);
        },

        insertNode: function (node, isBreakline) {
            var me = this;
            var selection = me.getSelection();

            if (!selection) {
                me.focus();
                selection = me.getSelection();
            }

            var deleteSelected = function () {
                if (!inTextNode && me.getContent() === '<br>') {
                    selection.selectNode(
                        me.element.getElementsByTagName('br')[0]
                    );
                }
                selection.deleteContents();
            };

            var inTextNode = selection.commonAncestorContainer.nodeType === NODE_TYPE_TEXT;

            var textNode;

            var startContainer = selection.startContainer;
            if (selection.collapsed
                && startContainer.nodeType === NODE_TYPE_TEXT
                && startContainer.nodeValue === EMPTY_VALUE
            ) {
                textNode = startContainer;
                if (inTextNode) {
                    var currentNode = textNode.previousSibling;
                    var previousSibling;
                    while (currentNode) {
                        previousSibling = currentNode.previousSibling;
                        if (currentNode.nodeType === NODE_TYPE_TEXT
                            && currentNode.nodeValue === ''
                        ) {
                            currentNode.parentNode.removeChild(currentNode);
                        }
                        else if (currentNode.nodeType === NODE_TYPE_ELEMENT) {
                            if (!isBreakline) {
                                inTextNode = false;
                            }
                            break;
                        }
                        currentNode = previousSibling;
                    }
                }
                deleteSelected();
            }
            else {
                textNode = document.createTextNode(EMPTY_VALUE);
                deleteSelected();
                selection.insertNode(textNode);
            }

            if (node.nodeType) {
                node = [ node ];
            }

            var currentNode = textNode;
            var parentNode = currentNode.parentNode;

            for (var i = node.length - 1, tempNode; tempNode = node[i]; i--) {
                parentNode.insertBefore(tempNode, currentNode);
                currentNode = tempNode;
            }


            if (inTextNode) {
                textNode.parentNode.insertBefore(
                    document.createElement('br'),
                    currentNode
                );
            }

            var range = document.createRange();
            range.setStart(textNode, 1);
            range.setEnd(textNode, 1);

            setRange(range);

            me.onContentChange();

        },

        /**
         * 插入图片之前先插入一个 Loading
         *
         * @param {string} id 图片元素的 id，方便之后调用 insertImage 时传入 id
         * @param {string} url loading 图地址
         */
        insertLoading: function (id, url) {
            var img = document.createElement('img');
            img.id = id;
            img.src = url;
            this.insertNode(img);
            img.scrollIntoView();
        },

        /**
         * 插入图片
         *
         * @param {string} id loading id
         * @param {string} url 图片地址
         * @param {number} width
         * @param {number} height
         */
        insertImage: function (id, url, width, height) {
            var img = document.getElementById(id);
            if (img && img.tagName === 'IMG') {
                img.src = url;
                img.removeAttribute('id');
                if (width) {
                    img.setAttribute('data-width', width);
                }
                if (height) {
                    img.setAttribute('data-height', height);
                }
            }
        }
    };

    global.Artitor = Artitor;

})(this);