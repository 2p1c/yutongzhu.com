<div align="center">

![A journey of a thousand miles begins with a single step](./media/image.png "width=60%")

</div>

### part 0

This part covers the evolution from how the original HTML web pages worked (sending an HTTP request to the server, the server processing the POST request and returning a 302 status code, which then requires the browser to redirect by making an HTTP GET request to the Location, and then fetching HTML, CSS, JS...), to today's full-stack development, where JavaScript programs run in the browser without further HTTP requests.

What exactly does full-stack development mean? A web service often includes a frontend, the end closest to the user, which sits at the top layer; it also includes a backend, a service on the server that listens to requests from the frontend and provides specific functionality; and often below the backend there is also a database. This forms a three-layer stack, and this is what we call full stack. The emergence of JavaScript made it possible to develop the full stack using the same programming language, which took development into a new dimension.

### The React journey begins

In React, we don't write code in index; more precisely, the index.html file does not contain any HTML markup visible in the browser. Everything that needs to be rendered is defined as a **React component**; **components**—defined as UI building blocks—is still quite accurate.

Functions are created using arrow functions; () means it takes no parameters:

```javascript
const APP = () => {
  return (
    <div>
      <p>Hello world</p>
    </div>
  )
}
```

Here the component is defined as a function; a function can contain any kind of JavaScript code, not necessarily just return this HTML. Also, the file App.jsx that we are writing now is not JavaScript; it is a syntax extension of JavaScript that allows us to use HTML-like markup inside it, and it is automatically compiled into JavaScript at compile time. Remember that every tag in JSX must be closed. Any JavaScript code inside curly braces will be executed; that is, if a value is the result of a JavaScript expression, remember to wrap it in curly braces.

Always remember to write console.log() in your code to print information to the console; this is worthwhile. Also, the name of a React component **must start with a capital letter**. Also, React children must be primitive values, such as numbers or strings; they cannot be objects.

---

### Learning JavaScript syntax

**Commonly used functions:**

'const' defines a constant whose value cannot be changed; 'let' defines an ordinary variable.
'forEach' takes a **function as its parameter**, defined using an arrow function

```typescript
t.forEach(value => {
  console.log(value)  // numbers 1, -1, 3, 5 are printed, each on its own line
})      
```

'concat()' returns a new array containing the new elements
'map()'

**Objects and functions:**

- How to define an object -- use curly braces to list the object's property values.
- How to reference an object -- use '.' or square brackets.
- An arrow function like 'p => p * p', when used directly without parentheses, simply returns the value of the expression.
- How to reference a function -- give the function name in a function declaration; use a function expression:
```typescript
const average = function(a, b) {
  return (a + b) / 2
}
#箭头语法就是：
const average = (a, b) => (a + b) / 2

const result = average(2, 5)
// result is now 3.5
```
