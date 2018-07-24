export default class Selection {

  constructor(el) {
    this.el = el
  }

  /**
   * 获取选区
   *
   * @return {Selection}
   */
  get() {
    let sel = window.getSelection()
    if (sel.rangeCount) {
      let range = sel.getRangeAt(0)
      if (this.el.contains(range.startContainer)) {
        return range
      }
    }
  }

  /**
   * 设置选区
   *
   * @param {Selection} selection
   */
  set(selection) {
    let sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(selection)
  }

  /**
   * 获取开始位置到 el 这区间的所有节点
   */
  startNodes() {
    let nodes = [ ]

    let range = this.get()
    if (range) {
      let node = range.startContainer
      do {
        nodes.push(node)
      }
      while (node = node.parentNode && node !== this.el)
    }

    return nodes
  }

  /**
   * 获取结束位置到 el 这区间的所有节点
   */
  endNodes() {
    let nodes = [ ]

    let range = this.get()
    if (range) {
      let node = range.endContainer
      do {
        nodes.push(node)
      }
      while (node = node.parentNode && node !== this.el)
    }

    return nodes
  }

  setRangeAfter(node, range) {
    if (range) {
      range.setEndAfter(node)
      range.collapse(true)
    }
  }

  setRangeBefore(node, range) {
    if (range) {
      range.setEndBefore(node)
      range.collapse(true)
    }
  }

  /**
   * 存储选区
   */
  save() {
    this.current = this.get()
  }

  /**
   * 恢复存储的选区
   */
  restore() {
    const { current } = this
    if (current) {
      this.set(current)
      delete this.current
      return current
    }
  }

  /**
   * 选区是否是折叠状态
   *
   * @return {boolean}
   */
  isCollapsed() {
    let sel = this.get()
    return sel && sel.isCollapsed
  }

  /**
   * 获取焦点
   */
  focus() {
    this.el.focus()
    let sel = window.getSelection()
    sel.selectAllChildren(this.el)
    sel.collapseToEnd()
  }

  /**
   * 失去焦点
   */
  blur() {
    this.el.blur()
  }

}