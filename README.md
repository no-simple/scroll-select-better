# 当下拉列表数据过大时，该如何应对？

> A Vue.js project

## demo地址
[demo](https://no-simple.github.io/scroll-select-better/)
## 文档说明

> 文档已在掘金发表

[文档说明](https://juejin.im/post/5be534086fb9a049ef2615e2)
# 前言

在日常开发中，除了现成插件的使用外，还有很多问题是只能自己动手的。先抛出问题，当一个下拉列表的数据达到几千条甚至上万，这个时候浏览器已经会出现严重卡顿了。看看下面的例子


![demo](https://user-gold-cdn.xitu.io/2018/11/9/166f76890d79c93b?w=350&h=517&f=gif&s=227936)
> 如图所示，数据量达到**2W**条**简单测试数据**（页面没有其他东西），点击加载下拉列表花了大概**5s**时间。出现这种情况心里真的是很复杂，这不是在玩我吗？

![](https://user-gold-cdn.xitu.io/2018/11/9/166f76dfcbd37da2?w=259&h=194&f=png&s=53352)
# 解决思路
这个问题其实和表格数据是同一个性能问题，表格的解决方式是通过分页器来减少页面承载的数据量。那么下拉列表该如何解决呢？通常我们都是一次性加载下拉的所有数据的，针对目前的难题，思路也是一样，采用分页来解决页面的性能问题。问题又来了，分页器是可以点击的，那下拉列表又不可以点击，那就只有在监听滚动事件里实现这件大事了。
## 先来大纲：
1. 监听滚动
2. 向下滚动时往后加载数据
3. 向上滚动时往前加载数据
4. 数据有进有出
![](https://user-gold-cdn.xitu.io/2018/11/9/166f7762b57887cf?w=322&h=182&f=png&s=63500)
> 好戏开始
## 1. 监听滚动
```
    <el-select class="remoteSelect" v-scroll v-model="value">
      <el-option :value="item.id" v-for="item in list" :key="item.id">{{item.name}}</el-option>
    </el-select>
```
> 这里是基于vue与element-ui中**el-select**实现的监听滚动。这里是采用自定义指令的方式监听滚动
```
// directives目录下index.js文件

import Vue from 'vue'
export default () => {
  Vue.directive('scroll', {
    bind (el, binding) {
      // 获取滚动页面DOM
      let SCROLL_DOM = el.querySelector('.el-select-dropdown .el-select-dropdown__wrap')
      SCROLL_DOM.addEventListener('scroll', function () {
        console.log('scrll')
      })
    }
  })
}
```
> 在main.js中通过全局方法Vue.use()注册使用
```
import Directives from './directives'
Vue.use(Directives)
```
> 这时滚动页面就可以看到控制的打印日志，代表监听已生效，接下来撸起袖子开干

![](https://user-gold-cdn.xitu.io/2018/11/9/166f78972e2e112f?w=670&h=572&f=gif&s=245924)
## 2. 向下滚动时往后加载数据
> 首先要先判断出是向上滚动，还是向下滚动
1. **记录上一次的滚动位置**
2. **当前位置与上一次的滚动位置作比较**
> 通过一个公共变量来记录全局位置，通过`scrollTop`方法获取当前的滚动位置，并记录在公共变量`scrollPosition`里
```
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
        console.log(flagToDirection ? '滚动方向：下' : '滚动方向：上')
      })
    }
```

![](https://user-gold-cdn.xitu.io/2018/11/9/166f7961a2297787?w=552&h=426&f=gif&s=356487)
> 目前已知晓滚动的方向，接下来便根据滚动方向做相应的处理。将滚动行为告诉组件
```
    ...省略
        // 记录当前的滚动位置
        scrollPosition = this.scrollTop
        // 将滚动行为告诉组件
        binding.value(flagToDirection)
```
> **事件接受**
> 在`v-scroll`指令中接受事件`v-scroll="handleScroll"`，在该方法`handleScroll`处理滚动行为。
> 接下来只需要在该事件中针对为向下的滚动发起请求数据即可
```
    /*********************************
      ** Fn: handleScroll
      ** Intro: 处理滚动行为
      ** @params: param 为true代表向下滚动
      ** @params: param 为false代表向上滚动
    *********************************/
    handleScroll (param) {
      if (param) {
        // 请求下一页的数据
        this.list.push(...this.ajaxData(++this.pageIndex))
      }
    },
```

![](https://user-gold-cdn.xitu.io/2018/11/9/166f7bb9d3fb4d5f?w=793&h=457&f=gif&s=261259)
> 到这里滚动加载已经实现。只是加载太频繁了，如果快速滚动则会同时发出多个请求后台数据，在密集一些游览器中ajax就要开发并发排队了，可见并不理想。那如何控制呢？那换种方式触发`handleScroll`事件，在滚动位置距离滚动页面底部一定高度时在触发，例如距页面底部只有`100px`时触发`handleScroll`事件
1. `scrollHeight`获取滚动高度
2. 在距底部100px时
```
        // 记录当前的滚动位置
        scrollPosition = this.scrollTop
        const LIMIT_BOTTOM = 100
        // 记录滚动位置距离底部的位置
        let scrollBottom = this.scrollHeight - (this.scrollTop + this.clientHeight) < LIMIT_BOTTOM
        // 如果已达到指定位置则触发
        if (scrollBottom) {
          // 将滚动行为告诉组件
          binding.value(flagToDirection)
        }
```

![](https://user-gold-cdn.xitu.io/2018/11/9/166f7ccd02c8595a?w=618&h=439&f=gif&s=731758)
> 通过数据长度的变化可以知道触发事件已经明显和谐了很多，这种效果很手机懒加载的方式一样，数据会被不断的叠加。

> **小提示：** 会存在一个bug，即ajax是异步的，如果这个ajax请求花了**1s**才返回数据，而此时还在继续往下滚，那就会触发多个请求事件。如何避免这种情况呢？  答案是增加一个标志位，在请求前将该标志位设置为false，请求结束后设置为true。每次请求时先判断该标志位。如果为false则阻止该事件。
# 中场
**再来看看我们的大纲**
1. **监听滚动**
2. **向下滚动时往后加载数据**
3. 向上滚动时往前加载数据
4. 数据有进有出
> 到这里我们只完成①和②两个步骤。如果已经满足了你的需求，那你可以结束阅读了。如果对你有那么一点点帮助，先点个赞在离开。


> 前面说的都还只是基础操作，还没开始划重点呢。说好的无性能压力呢？

![](https://user-gold-cdn.xitu.io/2018/11/9/166f7d93f4181a6a?w=350&h=350&f=png&s=60555)
1. 代码地址：[github](https://github.com/no-simple/selectScroll)
2. 当前版本demo：[demo]( https://no-simple.github.io/selectScroll/)


先下班回家吃饭吧。周末继续写完 --2018-11-09 18:15
********************************
**华丽的分割**
********************************

就像周末一样，**一切都会如期而至**。--2018-11-10 08:30


## 3. 向上滚动时往前加载数据

在`handleScroll`中判断参数`param`我们就得知了滚动行为，但之前我们只限制了向下滚动的触发时机，现在完善向上的滚动触发时机。同样的，先采用距离顶部`100px`的时候触发。
> 只要当前的滚动位置`scrollTop`小于`100px`就触发`handleScroll`事件
```
        // 如果向下滚动 并且距离底部只有100px
        if (flagToDirection && scrollBottom) {
          // 将滚动行为告诉组件
          binding.value(flagToDirection)
        }
        // 如果是向上滚动  并且距离顶部只有100px
        if (!flagToDirection && this.scrollTop < LIMIT_BOTTOM) {
          binding.value(flagToDirection)
        }
```
在`handleScroll`事件中我们就已经能检测到向上滚动行为了，并且触发时机也符合预期。


![](https://user-gold-cdn.xitu.io/2018/11/10/166fb787bf90cc54?w=519&h=472&f=gif&s=204239)
问题接踵而至，还一个比一个严重。一直向下滚动时分页加载则一直在累加，从第一页到一直滚动加载的页的数据都在列表里面了，那为何还需要向上加载呢？这里先埋下一个坑，先把**4. 数据有进有出** 看完这个坑就迎刃而解了。

## 4. 数据有进有出 
说好的无性能压力呢？就在这个关键点了。看图一目了然（找这个效果图不容易呀）：
1. 向下滚动（图中每次点击即代表一次触发滚动加载数据）

![](https://user-gold-cdn.xitu.io/2018/11/10/166fb86d2551675a?w=1216&h=434&f=gif&s=205227)
2. 向上滚动

![](https://user-gold-cdn.xitu.io/2018/11/10/166fb8b6e8594a10?w=1188&h=443&f=gif&s=211142)
3. 有进有出

![](https://user-gold-cdn.xitu.io/2018/11/10/166fb90bd6a373ee?w=1168&h=433&f=gif&s=365922)
如上图效果，这就是我们最终要达成的目的。向上滚动我们就加载上一页的数据，向下滚动就加载下一页的滚动。数据实体`list`始终只有一定的数据量，数据量再大又能奈我何呢？

![](https://user-gold-cdn.xitu.io/2018/11/10/166fb99429baa3e4?w=198&h=178&f=png&s=23228)
### 还是来看看如何实现吧
如何维持这个数组的长度呢？说起来有进有出很简单，但实现还是不简单的。

假设我们现在的数组容器最多容纳4页的数据量，每页100条数据。通过`pageLimit`参数来限定我们需要维护的数组长度，这里设为4。

当向下滚动或向上滚动时我们如何知道当前该加载那一页了？
> 所以我们需要一个记录表`pageMap`来记录页码，该页码表与当前的数据实体`list`对应。如下的对应关系。
```
pageLimit: 4
pageMap： [1, 2, 3, 4]
list：['第一页的数据', '第二页的数据', '第三页的数据', '第四页的数据']

```
效果图（目前滚动不科学，步骤正确，后面有优化滚动）：

![](https://user-gold-cdn.xitu.io/2018/11/10/166fbc5c2311b232?w=586&h=433&f=gif&s=1649772)

```
    /*********************************
      ** Fn: handleScroll
      ** Intro: 处理滚动行为
      ** @params: param 为true代表向下滚动
      ** @params: param 为false代表向上滚动
    *********************************/
    handleScroll (param) {
      if (param) {
        if (this.pageMap.length >= this.pageLimit) {
          // 当长度相等的时候， 绝对不能超出长度  则有进必有出
          // 删除 pageMap 列表的第一个元素
          this.pageMap.shift()
          // 对应删除list中一页的数据量
          this.list.splice(0, this.pageSize)
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
        } else return false
      }
    }
```
先写到这里吧，又该吃午饭了  2018-11.10 12:01


![](https://user-gold-cdn.xitu.io/2018/11/10/166fbc89245ce246?w=300&h=300&f=gif&s=132851)
下午好，冬天的太阳暖洋洋的~ 2018-11-10 13:04
### 优化滚动

接下来咱们来填一下上面留下的坑，当数据达到指定长度时，数据总量不会变了，那么滚动的总体高度`scrollHeight`也就固定了，这是数据虽然有进有出，但是对滚动位置`scrollTop`将不再有影响，如上面的动态图中效果，将会一滚到底，而此时却还不是分页的终点，却让用户误以为到底了~~  这个问题有点严重，有点严重~

![](https://user-gold-cdn.xitu.io/2018/11/10/166fc09c50303e97?w=196&h=182&f=png&s=37942)
> 优化方法：
1. 每次加载数据后将当前滚动位置回到总体滚动高度的中间位置。
此时我们需要将滚动`dom`以及中间位置的高度通过自定义指令`v-scroll`抛出来，在往头部添加数据或尾部添加数据时滚动位置定位到中间位置。

> 抛出DOM和滚动的中间位置
```
// directives目录下index.js文件
        // 如果向下滚动 并且距离底部只有100px
        if (flagToDirection && scrollBottom) {
          // 将滚动行为告诉组件
          binding.value(flagToDirection, SCROLL_DOM, this.scrollHeight / 2)
        }
        // 如果是向上滚动  并且距离顶部只有100px
        if (!flagToDirection && this.scrollTop < LIMIT_BOTTOM) {
          binding.value(flagToDirection, SCROLL_DOM, this.scrollHeight / 2)
        }
```
> 当`pageMap`（对应`list`长度）达到`pageLimit`长度时，进出增删数据时重置DOM滚动位置
```
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
          ....省略代码
          this.list.splice(0, this.pageSize)
          // 回滚到中间位置
          el.scrollTop = middlePosition
        }
        ....省略代码
      } else {
        // 如果在向上滚动时，如果还没有到达第一页则继续加载。 如果已到达则停止加载
        if (this.pageMap[0] > 1) {
            ....省略代码
          this.list = [...this.ajaxData(this.pageIndex), ...this.list]
          // 回滚到中间位置
          el.scrollTop = middlePosition
        } else return false
      }
    },
```

![](https://user-gold-cdn.xitu.io/2018/11/10/166fc211d330faa9?w=751&h=876&f=gif&s=1640520)
效果如上图所示，应该要结尾了？仔细观察的同学又发现彩蛋了。在滚动跳跃的一瞬间，原来用户看到的数据由于跳动后数据不在是原来用户看到的数据了，**呀呀呀** ..... 这个问题有点严重，**得慌**

![](https://user-gold-cdn.xitu.io/2018/11/10/166fc280d5e2e86f?w=198&h=150&f=png&s=35239)
2. 优化滚动临界点
临界点即距离滚动**总体高度**顶部或底部一定距离时，触发handleScroll的临界点，即常量`LIMIT_BOTTOM`。之前定义的`const LIMIT_BOTTOM = 100`为100，这个是没啥道理，那么来个正经的临界点。
### 条件梳理
1. 每次回到到 `1/2 scrollHeight`的位置
2. 每次数据的变化位置为 `（1 / pageLimit） * scrollHeight`，这里演示的是`1/4 * scrollHeight`
3. 设置一个未知数 **X** 为跳跃的临界点
4. 临界点是用户在跳跃前看到的位置
5.  `1/2 scrollHeight`是用户跳跃之后的位置
> 表达式： x + (1/4 * scrollHeight) = (1/2 scrollHeight)

> x = (1/4 * scrollHeight),即 `const LIMIT_BOTTOM = this.scrollHeight / 4`
那我们再开看看滚动情况：


![](https://user-gold-cdn.xitu.io/2018/11/10/166fc37ca23c65dd?w=734&h=830&f=gif&s=919631)
效果已经差不多了，如果想用户最后看到位置在靠下一些，可以设置`const LIMIT_BOTTOM = this.scrollHeight / 4.2`
# 结语
故事到这里终于结束了。**点个赞** 给个鼓励咯~

在github新建一个仓库来上传代码：
1. demo查看：[demo](https://no-simple.github.io/scroll-select-better/)
2. github代码查看：[传送门](https://github.com/no-simple/scroll-select-better)
3. 这篇很实用呀，则没人欣赏呢[Vue自定义指令实现input限制输入正整数](https://juejin.im/post/5bc5c48f6fb9a05d09658093)
* **版权说明：本文首发于掘金，如需转载请注明出处。**

> **种一棵树最好的时间是十年前，其次是现在**。 --谁说的不重要。
``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
