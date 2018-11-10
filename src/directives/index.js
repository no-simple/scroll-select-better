import Vue from 'vue'
export default () => {
  Vue.directive('scroll', {
    bind (el, binding) {
      // 获取滚动页面DOM
      let SCROLL_DOM = el.querySelector('.el-select-dropdown .el-select-dropdown__wrap')
      let scrollPosition = 0
      SCROLL_DOM.addEventListener('scroll', function () {
        // 当前的滚动位置 减去  上一次的滚动位置
        // 如果为true则代表向上滚动，false代表向下滚动
        let flagToDirection = this.scrollTop - scrollPosition > 0
        // 记录当前的滚动位置
        scrollPosition = this.scrollTop
        const LIMIT_BOTTOM = this.scrollHeight / 4.2
        // 记录滚动位置距离底部的位置
        let scrollBottom = this.scrollHeight - (this.scrollTop + this.clientHeight) < LIMIT_BOTTOM
        // 如果向下滚动 并且距离底部只有100px
        if (flagToDirection && scrollBottom) {
          // 将滚动行为告诉组件
          binding.value(flagToDirection, SCROLL_DOM, this.scrollHeight / 2)
        }
        // 如果是向上滚动  并且距离顶部只有100px
        if (!flagToDirection && this.scrollTop < LIMIT_BOTTOM) {
          binding.value(flagToDirection, SCROLL_DOM, this.scrollHeight / 2)
        }
      })
    }
  })
}
