<template>
  <div class="remote">
    <h6>数据长度：{{list.length}}</h6>
    <h6>页码表：{{pageMap}}</h6>
    <el-select class="remoteSelect" v-scroll="handleScroll" v-model="value">
      <el-option :value="item.id" v-for="item in list" :key="item.id">{{item.name}}</el-option>
    </el-select>
  </div>
</template>

<script type="text/ecmascript-6">
export default {
  data () {
    return {
      pageIndex: 1, // 分页中请求的页面
      pageSize: 100, // 自定义  每页的大小
      value: '', // select绑定的实体
      pageLimit: 4, // 需维护数组的长度
      pageMap: [], // 对应数组长度的页码表
      list: [] // 下列列表的数据，接口获取
    }
  },
  methods: {
    /*********************************
      ** Fn: handleScroll
      ** Intro: 处理滚动行为
      ** @params: param 为true代表向下滚动 为false代表向上滚动
      ** @params: el 滚动DOM
      ** @params: middlePosition 滚动列表的中间位置
    *********************************/
    handleScroll (param, el, middlePosition) {
      if (param) {
        if (this.pageMap.length >= this.pageLimit) {
          // 当长度相等的时候， 绝对不能超出长度  则有进必有出
          // 删除 pageMap 列表的第一个元素
          this.pageMap.shift()
          // 对应删除list中一页的数据量
          this.list.splice(0, this.pageSize)
          // 回滚到中间位置
          el.scrollTop = middlePosition
        }
        ++this.pageIndex
        this.pageMap.push(this.pageIndex)
        // 请求下一页的数据
        this.list.push(...this.ajaxData(this.pageIndex))
        // 同步记录页码
      } else {
        // 如果在向上滚动时，如果还没有到达第一页则继续加载。 如果已到达则停止加载
        if (this.pageMap[0] > 1) {
          // 向上滚动，取出pageMap中第一个元素值减1
          this.pageIndex = this.pageMap[0] - 1
          // 同步设置分页
          // ①先删除最后一个元素
          this.pageMap.pop()
          // ②将新元素添加在头部
          this.pageMap = [this.pageIndex, ...this.pageMap]
          // ①删除list中最后一页的数据
          this.list.splice(-this.pageSize, this.pageSize)
          // ②将新数据添加在头部位置
          this.list = [...this.ajaxData(this.pageIndex), ...this.list]
          // 回滚到中间位置
          el.scrollTop = middlePosition
        } else return false
      }
    },
    /*********************************
      ** Fn: ajaxData
      ** Intro: 模拟ajax请求数据,每次返回100条数据
      ** @params:  pageIndex 代表请求的页码
      ** Author: zyx
    *********************************/
    ajaxData (pageIndex) {
      // 每页数量
      let pageSize = 100
      let list = []
      for (let i = pageSize * (pageIndex - 1); i < pageSize * pageIndex; i++) {
        list.push({
          name: `这是一条测试数据 代号：${i}`,
          id: i
        })
      }
      return list
    }
  },
  created () {
    // 模拟ajax请求，初始加载第一页数据
    this.list = this.ajaxData(this.pageIndex)
    // 第一加载同步记录页码
    this.pageMap.push(this.pageIndex)
  }
}
</script>
<style lang='stylus' rel='stylesheet/stylus'>
  .remote
      text-align center
</style>
