/**
 * 处理文本粘贴
 *
 * 复制一段文本到编辑器中进行粘贴时，流程如下：
 *
 * 1. 准备一个干净的可编辑的元素，让它聚焦
 * 2. 当粘贴动作发生时，让这个元素去承接被复制的文本
 * 3. 从这个元素读取内容
 */

/**
 * 字符串不好操作的元素
 *
 * @type {Array}
 */
const COMPLEX_TAGS = [ 'noscript', 'script', 'video', 'audio', 'object', 'img', 'style', 'embed', 'form' ]

/**
 * 支持的标签列表
 *
 * @type {Array}
 */
const SUPPORTED_TAGS = [ 'div', 'p', 'br', 'strong', 'b', 'em', 'i', 'strike', 'u' ]

export default function (onRead) {

  let pasteReadHolder, pasteReadTimer, tryCount, maxTryCount = 3

  return function () {

    if (pasteReadTimer) {
      clearTimeout(pasteReadTimer)
      pasteReadTimer = null
    }



    // 准备一个干净的元素
    if (pasteReadHolder) {
      pasteReadHolder.innerHTML = ''
    }
    else {
      pasteReadHolder = document.createElement('div')
      pasteReadHolder.style.cssText = 'position: absolute;top: 0; left: 0;opacity: 0;'
      pasteReadHolder.contentEditable = true
    }
    document.body.appendChild(pasteReadHolder)

    // 聚焦后，等待内容被粘贴进去
    pasteReadHolder.focus()



    tryCount = 0

    let processContent = function () {

        // 先去掉一些字符串不好操作的元素
        COMPLEX_TAGS.forEach(
          function (tag) {
            let nodes = pasteReadHolder.querySelectorAll(tag)
            for (let i = nodes.length - 1; i >= 0; i--) {
              nodes[i].parentNode.removeChild(nodes[i])
            }
          }
        )

        let content = pasteReadHolder.innerHTML

        // 去掉属性，保证接下来处理的是干净的标签
        content = content.replace(/<(\w+)(\/| [^>]+)>/g, '<$1>')

        // 支持有限的标签
        content = content.replace(
          /<(\/?)(\w+)>/g,
          function ($0, $1, $2) {
            $2 = $2.toLowerCase()
            return SUPPORTED_TAGS.indexOf($2) >= 0 ? `<${$1}${$2}>` : ''
          }
        )

        // 这么一波操作下来还剩有内容，交给外部处理
        if (content) {
          let div = document.createElement('div')
          div.innerHTML = content
          onRead(div.childNodes)
        }

    }

    let readContent = function () {
      if (pasteReadHolder.textContent) {
        processContent()
        document.body.removeChild(pasteReadHolder)
      }
      else {
        // 如果没读取到就再等一会
        pasteReadTimer = setTimeout(
          function () {
            pasteReadTimer = null
            if (tryCount < maxTryCount) {
              readContent()
              tryCount++
            }
            else {
              document.body.removeChild(pasteReadHolder)
            }
          },
          50
        )
      }
    }

    readContent()

  }
}