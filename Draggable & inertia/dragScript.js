const box = document.querySelector("#box");
const heading = document.querySelector(".h1");
const circleWrapper = document.querySelector(".circle-wrapper");


Draggable.create({box, heading, circleWrapper},{
  type:'x,y',
  inertia:true,
})

console.log("hi this is the box:", box)
console.log("hi this is the heading:", heading)
console.log("hi this is the circle wrapper:", circleWrapper)

