class Selection {

  constructor(el) {
    this.el = el
  }

  get() {
    let sel = window.getSelection()
    if (sel.rangeCount) {
      let range = sel.getRangeAt(0)
      if (this.el.contains(range.startContainer)) {
        return range
      }
    }
  }

  set(selection) {
    let sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(selection)
  }

  save() {
    this.current = this.get()
  }

  restore() {
    this.current && this.set(this.current)
  }

  isCollapsed() {
    return this.current && this.current.isCollapsed
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