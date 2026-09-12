<div align="center">

![千里之行始于足下](./media/image.png "width=60%")

</div>

### part 0

这一部分讲了从原始的HTML网页运行过程（向服务器发送HTTP请求，服务器处理POST请求再返回一个302状态码，这个状态码又要求浏览器重定向对Location执行一个HTTP GET请求，再获取HTML，CSS，JS...），到如今的全栈开发在浏览器执行javascript程序而不需要进一步的HTTP请求。

全栈开发到底指什么：往往一个web服务包含前端，就是最接近用户的一端，这个在最上层；还包括一个后端，就是服务器上的服务，监听前端的请求并提供特定的功能；往往在后端的下面还有一个数据库。这样就形成了一个三层的堆叠结构（stack），我们就把这称为全栈。javascript的出现，使得全栈能够用同一种编程语言来开发，这使开发进入了一个新的维度。

### 反应之旅开始了

在React中我们不在index中代码，准确的说index.html文件不包含任何浏览器中可见的HTML标记。所有需要渲染的内容都定义为**React组件**，**components**--定义为 UI building blocks还是很准确的。

使用箭头函数创建函数，()表示不包含任何参数：

```javascript
const APP = () => {
  return (
    <div>
      <p>Hello world</p>
    </div>
  )
}
```

这里组件被定义为一个function，function可以包含任意种类的JavaScript代码，不一定只是返回这些html。然后现在编写的这个文件 App.jsx 不是javascript，他是javascript的一个语法扩展，允许我们在其中使用类似html的标记，在编译时会被自动编译为javascript。记得JSX中每个标签都需要闭合。任何位于花括号内的javascript代码都会被执行，也就是说如果某个值是javascript表达式的结果，记得把它用花括号括起来。

永远记得在代码中编写console.log()将信息打印到控制台，this is worthwhile。还有React组件名称的**首字母必须大写**。还有React的子元素必须是原始值，例如数字或字符串，不能是对象 object

---

### 学习javascript语法

**常用的函数：**

'const'定义常量，值不能再改；'let'定义一个普通的变量。
'forEach'接收一个使用箭头函数定义的**函数作为参数**

```typescript
t.forEach(value => {
  console.log(value)  // numbers 1, -1, 3, 5 are printed, each on its own line
})      
```

'concat()' 返回一个包含新元素的新数组
'map()'

**对象、函数：**

- 如何定义对象--用花括号列出对象的属性值。
- 如何引用对象--用'.'或者方括号来引用。
- 箭头函数像这样 'p => p * p' 不加括号直接使用的时候就是直接返回表达式的值。
- 如何引用函数--在函数声明中给出函数名；使用函数表达式：
```typescript
const average = function(a, b) {
  return (a + b) / 2
}
#箭头语法就是：
const average = (a, b) => (a + b) / 2

const result = average(2, 5)
// result is now 3.5
```






