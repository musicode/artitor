(function (global) {

    var NODE_TYPE_ELEMENT = 1;
    var NODE_TYPE_TEXT = 3;

    var KEY_CODE_ENTER = 13;

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
                        document.createElement('br')
                    );
                }
            }
        );

        element.addEventListener(
            'paste',
            me.onPaste = function (event) {
                event.preventDefault();
                var clipboard = event.clipboardData;
                var text = clipboard.getData('text/plain');
                if (text) {
                    me.insertNode(
                        document.createTextNode(text)
                    );
                }
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
                var selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(this.currentSelection);
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
            return this.element.innerHTML;
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

        insertNode: function (node) {
            var selection = this.getSelection();
            if (!selection) {
                this.focus();
                selection = this.getSelection();
            }

            var inTextNode = selection.commonAncestorContainer.nodeType === NODE_TYPE_TEXT;
            if (!inTextNode && this.getContent() === '<br>') {
                selection.selectNode(
                    this.element.getElementsByTagName('br')[0]
                );
            }

            selection.deleteContents();
            selection.insertNode(node);
            if (inTextNode) {
                node.parentNode.insertBefore(
                    document.createElement('br'),
                    node
                );
            }
            selection.setStartAfter(node);
            selection.setEndAfter(node);

            this.onContentChange();

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