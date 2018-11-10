<template>
    <el-select
      v-model="selectModel"
      class="init_select" 
      remote
      filterable
      :remote-method="handleFilterRemote"
      v-loadmore="handleScrollLoading"
      placeholder="请输入关键词">
          <el-option
            v-for="(item, i) in selectList"
            :key="i"
            :label="item[keyValue[0]]"
            :value="item[keyValue[1]]">
                  <!-- <span v-if="customize" class="customize_overflow" style="float: left;width:calc(100% - 260px)" show-overflow-tooltip>{{ item[keyValue[0]] }}</span>
                  <span v-if="customize" style="float: right;width:260px">{{ item[keyValue[1]] }}</span> -->
        </el-option>
    </el-select>
</template>

<script>
export default {
  props: {
    // 父级v-model绑定
    value: {
      type: [String, Number]
    },
    // 父级传传递的url
    url: {
      type: String
    },
    // 键值对，默认使用Key  和Value
    keyValue: {
      type: Array,
      default: () => ['Key', 'Value']
    },
    default: {
      type: Object
    },
    customize: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      selectList: [], // 下拉列表
      pageMap: [1], // 对应数组长度的页码表   页码表的长度始终和 selectList的长度相同
      pageLimit: 4, // 需维护数组的长度
      isSelectLoading: false, // 防止触发多个滚动加载事件
      pageCount: 0, // 总数据量 
      selectParams: {
        Name: '', // 
        RecordArea: this.$store.state.permission.recordArea,
        PageSize: 50, //	查询数量
        PageIndex: 1 //	当前页
      }
    }
  },
  computed: {
    // v-model绑定值
    selectModel: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
        this.$emit('change', this.selectList)
      }
    }
  },
  methods: {
    /*********************************
      ** Fn: handleScrollLoading
      ** Intro: 处理滚动加载
      ** @params: param为up，则代表在向上滚动
      ** @params: param为down，则代表在向下滚动
      ** Author: zyx
    *********************************/
    handleScrollLoading (el, middlePosition, param) {
      if (!this.isSelectLoading) {
        if (param === 'down') {
          // 如果已是最后一页，则直接return
          if (this.pageCount === this.selectParams.PageIndex) return
          ++this.selectParams.PageIndex
          this.postSelectList(el, middlePosition, param)
        } else {
          // 如果在向上滚动时，如果还没有到达第一页则继续加载。 如果已到达则停止加载
          if (this.pageMap[0] > 1) this.selectParams.PageIndex = this.pageMap[0] - 1
          else return false
          // this.selectParams.PageIndex = this.pageMap[0]
          // --this.selectParams.PageIndex
          this.postSelectList(el, middlePosition, param)
        }
      }
    },
    /*********************************
      ** Fn: handleFilterRemote
      ** Intro: 远程服务器关键字搜索
      ** @params: value 关键字
      ** Author: zyx
    *********************************/
    handleFilterRemote (value) {
      // 每次触发时页码初始化
      this.selectParams.PageIndex = 1
      // 页码表也进行初始化
      this.pageMap = [1]
      this.selectParams.Name = value
      this.postSelectList()
    },
    /*********************************
      ** Fn: postSelectList
      ** Intro: 获取企业列表，只需获取一次
      ** @params: param ①down  代表向下滚动 ②up 代表向上滚动  ③无参数时代表默认加载数据
      ** Author: zyx
    *********************************/
    postSelectList (el, middlePosition, param) {
      // isSelectLoading = false代表当前没有其他在加载
      this.isSelectLoading = true
      // this.$axios('Config/Enterprise/GetListAsWhere', this.selectParams).then(res => {
      this.$axios(this.url, this.selectParams).then(res => {
        if (res.data.Success) {
          // 总页面统计，向上取整
          this.pageCount = Math.ceil(res.data.Data.TotalCount / res.data.Data.PageSize)
          if (param === 'down') {
            // 向下滚动则尾部追究数据
            if (this.pageMap.length >= this.pageLimit) {
              // 当长度相等的时候， 绝对不能超出长度  则有进必有出
              // 删除 pageMap 列表的第一个元素
              this.pageMap.shift()   
              // 对应删除页面的数据长度
              this.selectList.splice(0, this.selectParams.PageSize)
              el.scrollTop = middlePosition
            }
            // 向尾部添加数据
            this.pageMap.push(this.selectParams.PageIndex)
            this.selectList.push(...res.data.Data.Data)
          } else if (param === 'up') {
            // 向上滚动则首部追加数据
            this.pageMap.pop()
            this.pageMap = [this.selectParams.PageIndex, ...this.pageMap]
            this.selectList.splice(-this.selectParams.PageSize, this.selectParams.PageSize)
            this.selectList = [...res.data.Data.Data, ...this.selectList]
            el.scrollTop = middlePosition
          } else {
            // 否则则是初始化加载，只有一页数据
            this.selectList = this.default ? [this.default, ...res.data.Data.Data.filter(x => x[this.keyValue[1]] !== this.default[this.keyValue[1]])] : res.data.Data.Data
            // this.selectList = res.data.Data.Data
            // if (this.default) this.$set(this.selectList, 0, this.default)
          }
        } else {
          this.$message({
            showClose: true,
            message: '获取企业列表失败',
            type: 'info'
          })
        }
      }).then(() => {
        this.isSelectLoading = false
      }).catch(() => {
        this.isSelectLoading = false
      })
    }
  },
  created () {
    this.postSelectList()
  }
}
</script>
<style lang='stylus' rel='stylesheet/stylus'>
  .customize_overflow
      float: left
      width:calc(100% - 260px)
      overflow hidden
      white-space nowrap
      text-overflow ellipsis
</style>

